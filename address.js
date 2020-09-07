// Copyright 2017-2018 The futuremine developers
// Use of this source code is governed by an ISC
// license that can be found in the LICENSE file.

const Buffer = require('safe-buffer').Buffer
const qitmeer58check = require('./qitmeer58check').default
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
    toTokenAddress: toTokenAddress,
};

function fromBase58Check(address) {
    const payload = qitmeer58check.decode(address)
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
    return qitmeer58check.encode(payload)
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
    let topHash;
    if (version === 'testnet') topHash = Buffer.from([0x08, 0x51]);
    else if (version === 'mainnet') topHash = Buffer.from([0x08, 0x15]);


    const buf = Buffer.concat([
        topHash,
        hash.ripemd160(hash.sha256(buff))
    ]);
    const checkSum = hash.sha256((hash.sha256(buf))).slice(0, 4);
    return base58.encode(Buffer.concat([buf, checkSum]))
}

/**
 * 生成token地址
 * @param address           发币地址
 * @param shorthand         币的简写
 * @param network           网络
 * @returns {string}
 */
function toTokenAddress(address, shorthand, network) {
    let topHash;
    if (network === 'testnet') topHash = Buffer.from([0x08, 0x62]);
    else if (network === 'mainnet') topHash = Buffer.from([0x08, 0x24]);
    console.log('生成token address');
    let addrByte = base58.decode(address);
    let shortByte = stringToBytes(shorthand);
    let concatByte = [];
    for (let i = 0, len = addrByte.length; i < len; i++) {
        concatByte.push(addrByte[i]);
    }
    for (let i = 0, len = shortByte.length; i < len; i++) {
        concatByte.push(shortByte[i]);
    }

    const buf = Buffer.concat([
        topHash,
        hash.ripemd160(hash.sha256(concatByte))
    ]);
    const checkSum = hash.sha256((hash.sha256(buf))).slice(0, 4);
    return base58.encode(Buffer.concat([buf, checkSum]))
}

// JS字符串转Byte[]
const stringToBytes = (str) => {
    let ch, st, re = [];
    for (let i = 0; i < str.length; i++) {
        ch = str.charCodeAt(i);  // get char
        st = [];                 // set up "stack"
        do {
            st.push(ch & 0xFF);  // push byte to stack
            ch = ch >> 8;          // shift value down by 1 byte
        }
        while (ch);
        // add stack contents to result
        // done because chars have "wrong" endianness
        re = re.concat(st.reverse());
    }
    // return an array of bytes
    return re;
};
