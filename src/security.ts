import md5 from "md5-crypto";
import crypto from "crypto";

// const appKey = "434a209a5ce141c3b726de067835d7f0";
const signKey = "xhdiwjnchekd4d512chdjx5d8e4c394D2D7S";

const encKey = md5(signKey);
// const dynamicKey = md5(appKey).substring(0, 16);

const decrypt = (data: Buffer) => {
    const decipher = crypto.createDecipheriv("aes-128-ecb", Buffer.from(encKey, "hex"), null);
    const r = decipher.update(data);
    const f = decipher.final();
    return Buffer.concat([r, f]);
};

export {
    decrypt,
};
