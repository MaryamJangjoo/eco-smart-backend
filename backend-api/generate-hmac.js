const crypto = require('crypto');

const devicePublicKeyPem = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEvEf1uFDl3062wr7ITOwrQov+JlVs
pSL0BmkfunEFIaxEaGb4aPn4j+dP6rZz5sq71DPdzc01mOZL4rjmoZ8OxA==
-----END PUBLIC KEY-----`;

const serverPublicKeyPem = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEmJqf8TY1PCbtmV+dzcH3XYJp5FYR
EgFmAh1phcZnWxnh2xNYOjax57BjoEgrZXGrNQm/dHgz3i8+8vr+cKhzIQ==
-----END PUBLIC KEY-----`;

const devicePrivateKeyPem = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgi/R3CY086u90y3t/
W9+btRqjJ5MW+joGk0KglZuvqFihRANCAAS8R/W4UOXfTrbCvshM7CtCi/4mVWyl
IvQGaR+6cQUhrERoZvho+fiP50/qtnPmyrvUM93NzTWY5kviuOahnw7E
-----END PRIVATE KEY-----`;

const devicePrivateKey = crypto.createPrivateKey({
  key: devicePrivateKeyPem,
  format: 'pem',
  type: 'pkcs8',
});

const serverPublicKey = crypto.createPublicKey({
  key: serverPublicKeyPem,
  format: 'pem',
  type: 'spki',
});

const sharedSecret = crypto.diffieHellman({
  privateKey: devicePrivateKey,
  publicKey: serverPublicKey,
});

function hkdfExtractAndExpand(secret, salt, info) {
  const prk = crypto
    .createHmac('sha256', Buffer.from(salt))
    .update(secret)
    .digest();

  const okm = crypto
    .createHmac('sha256', prk)
    .update(info)
    .update(Buffer.from([0x01]))
    .digest();

  return okm.slice(0, 32);
}

const sessionKey = hkdfExtractAndExpand(
  Buffer.from(sharedSecret),
  'mYBUS-v2-Salt',
  'mYBUS-v2-Session'
);

const nonce = crypto.randomBytes(16).toString('hex');
const hmac = crypto
  .createHmac('sha256', sessionKey)
  .update(nonce)
  .digest('hex');

console.log('🆕 Nonce:', nonce);
console.log('🔐 HMAC:', hmac);
console.log('🔑 Session Key (hex):', sessionKey.toString('hex'));