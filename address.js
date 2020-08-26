// Copyright 2017-2018 The futuremine developers
// Use of this source code is governed by an ISC
// license that can be found in the LICENSE file.

const Buffer = require('safe-buffer').Buffer
const Base58check = require('./base58check').default
const Network = require('./networks')
const Script = require('./script')
const types = require('./types')
const typecheck = require('./typecheck')
const hash = require('./hash');
const base58 = require('bs58');

module.exports = {
    fromBase58Check: fromBase58Check,
    toBase58Check: toBase58Check,
    toOutputScript: toOutputScript,
    toAddress: toAddress,
}

function fromBase58Check(address) {
    const payload = Base58check.decode(address)
    if (payload.length < 22) throw new TypeError(address + ' is too short')
    if (payload.length > 22) throw new TypeError(address + ' is too long')

    const version = payload.readUInt16BE(0)
    const hash = payload.slice(2)

    return {version: version, hash: hash}
}

function toBase58Check(hash, version) {
    typecheck(types.Hash160, hash)
    const payload = Buffer.allocUnsafe(22)
    payload.writeUInt16BE(version, 0)
    hash.copy(payload, 2)
    return Base58check.encode(payload)
}

function toOutputScript(address, network) {
    network = network || Network.privnet
    const decode = fromBase58Check(address)
    if (decode) {
        if (decode.version === network.pubKeyHashAddrId) return Script.Output.P2PKH(decode.hash)
        if (decode.version === network.ScriptHashAddrID) return Script.Output.P2SH(decode.hash)
        throw Error('Unknown version ' + decode.version)
    }
    throw Error('fail to base58check decode ' + address)
}

//生成地址
function toAddress(buff, version) {
    let a;
    if (version === 'testnet') a = Buffer.from([0x08, 0x51]);
    else if (version === 'mainnet') a = Buffer.from([0x08, 0x15]);

    const b = hash.ripemd160(hash.sha256(buff));

    const buf = Buffer.concat([
        a,
        hash.ripemd160(hash.sha256(buff))
    ]);
    const checkSum = hash.sha256((hash.sha256(buf))).slice(0, 4);
    return base58.encode(Buffer.concat([buf, checkSum]))
}
