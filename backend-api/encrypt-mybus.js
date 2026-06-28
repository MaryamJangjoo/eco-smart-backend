const crypto = require('crypto');

const sessionKeyHex = 'da7217d560f1c4a9d552caa0129b8d923760d96d5758fb4260eb2fc120191794';
const sessionKey = Buffer.from(sessionKeyHex, 'hex');

const plaintext = JSON.stringify({
  action: 'WRITE',
  registryAddress: 200,
  value: '1'
});

const iv = crypto.randomBytes(12);
console.log('📤 IV:', iv.toString('hex'));

const cipher = crypto.createCipheriv('aes-256-gcm', sessionKey, iv);
let encrypted = cipher.update(plaintext, 'utf8', 'hex');
encrypted += cipher.final('hex');
const authTag = cipher.getAuthTag();

console.log('📤 AuthTag:', authTag.toString('hex'));
console.log('📤 EncryptedData:', encrypted);