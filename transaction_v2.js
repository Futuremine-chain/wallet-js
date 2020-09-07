import hash from './hash';
import ec from './ec';
import address from './address';
import signature from './signature';
import tx from './transaction';

const Buffer = require('safe-buffer').Buffer;


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

//获取当前时间戳
const getTimeStamp = () => {
    let time = new Date().getTime().toString();
    time = time.substring(0, time.length - 3);
    return parseInt(time)
};


//交易 json
const toJson = (params) => {
    if (!params) params = {};

    let json = {
        msgheader: {
            msghash: params.msghash ?? '0x0000000000000000000000000000000000000000000000000000000000000000',
            type: params.type ?? 0,//0:转账交易 , 1:token发布
            from: params.from,//我的地址
            nonce: params.nonce,
            fee: params.fee,//手续费
            time: params.time,
            signscript: {
                signature: params.signature ?? '',
                pubkey: params.pubkey ?? '',
            },
        },
    };
    if (params.type === 0) {
        json.msgbody = {
            token: params.token ?? 'FM',
            to: params.to,
            amount: params.amount,
        };
    } else if (params.type === 1) {
        //生成 token 地址
        const tokenAddr = address.toTokenAddress(params.from, params.shorthand, params.network);
        json.msgbody = {
            address: tokenAddr,     //生成的token地址
            receiver: params.receiver,    //接收钱的地址
            name: params.name,                                  //token名称
            shorthand: params.shorthand,                        //token缩写
            amount: params.amount,                              //创建token个数
            allowedincrease: params.allowedincrease ?? false,   //是否支持增发
        };
    }
    return json
};

//交易签名
const sign = (params) => {
    const keyPair = ec.fromWIF(params.privatekey);
    console.log(params);
    let result = JSON.parse(JSON.stringify(params));
    //生成hash
    let msgHash = hash.sha256(stringToBytes(JSON.stringify(toJson(result))));
    msgHash = `0x${Buffer.from(msgHash).toString('hex')}`;
    //去掉 0x 后转 buffer
    const bufferHash = Buffer.from(msgHash.substring(2), 'hex');
    //签名
    let sign = keyPair.sign(bufferHash);
    sign = signature.encode(sign, tx.SIGHASH_ALL);
    sign = Buffer.from(sign).toString('hex');
    //赋值
    result.msghash = `${msgHash}`;
    result.signature = sign;
    result.pubkey = Buffer.from(keyPair.publicKey).toString('hex');
    return toJson(result);
};

module.exports = {
    sign,
    toJson,
    getTimeStamp,
};


