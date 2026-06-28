const crypto = require('crypto');

const serverPublicKeyPem = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAENr7Cs+DotYawwa2a/LD8MSrJ6nP1
O7bS6rw4cizB4RcAGs0hzneLIp1H0lRqjKRBda9TBzh0wGFMPpUmbmuNAA==
-----END PUBLIC KEY-----`;

const devicePublicKeyPem = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEJhb5pnaoagqFIrLhEIZR92i8PHWS
6X/DbP2jOx6pz5M5WlWlt1WZV4tnh8F8+k0YTWlMHT0eBS+6TWD1n8BN8w==
-----END PUBLIC KEY-----`;

const serverPublicKeyPem = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE42T5+rvdi5aLIZclDeRDOsaCMDDr
7ROjO1QOyn5zzUdgca5AdjLOD2MsxsS8YChPqRu4UuNgN4/brVd8nRLYkA==
-----END PUBLIC KEY-----`;

const devicePrivateKeyPem = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgqoK1F4otv6fG+PLN
Q7cLOvNrb6aMnY6i53pmL8E4ZQehRANCAAS8R/W4UOXfTrbCvshM7CtCi/4mVWyl
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