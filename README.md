const chain = require('futuremine-js');

//npm install blakejs safe-buffer bs58 randombytes tiny-secp256k1 varuint-bitcoin bip66 crypto

//生成地址
const network = chain.networks.mainnet;
const randomBytes = chain.ec.fromEntropy();
const keyPair = chain.ec.fromPrivateKey(randomBytes.privateKey, {network: network});
const address = chain.address.toAddress(keyPair.publicKey, network);
const privatekey = keyPair.toWIF();
console.log(privatekey);
console.log(address);


//交易
let fee = 0.01;
let nonce = 1;//通过api获取 nonce值
const params = {
    type: 0,//type:0 交易
    from: address,
    network: network,
    privatekey: privatekey,
    nonce: nonce + 1,
    fee: fee * 1e8,
    time: chain.fm.getTimeStamp(),
    amount: 10 * 1e8,
    to: '转账地址'
};
//发送code到api进行交易
const code = chain.fm.sign(params);

//token 发币
let feeToken = 0.1;
const paramsToken = {
    type: 1,
    network: network,
    privatekey: privatekey,
    from: address,
    nonce: nonce + 1,
    fee: feeToken * 1e8,
    time: chain.fm.getTimeStamp(),
    receiver: '发送到谁的地址上',
    name: '币名称',
    shorthand: '币缩写，全大写',
    amount: 10000 * 1e8,
    allowedincrease: true,//是否可以增发
};
//发送 codetoken 到api进行token发布
const codeToken = chain.fm.sign(paramsToken);
