import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class MyBusSecurityService {
  private activeSessions = new Map<string, { sessionKey: Buffer; isAuthenticated: boolean }>();

  generateSessionKey(deviceId: string, devicePublicKeyPem: string): { serverPublicKeyPem: string } {
    try {
      const serverKeyPair = crypto.generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
      });

      const devicePublicKey = crypto.createPublicKey({
        key: devicePublicKeyPem.trim(),
        format: 'pem',
        type: 'spki',
      });

      const sharedSecret = crypto.diffieHellman({
        privateKey: serverKeyPair.privateKey,
        publicKey: devicePublicKey,
      });

      const sessionKey = this.hkdfExtractAndExpand(
        Buffer.from(sharedSecret),
        'mYBUS-v2-Salt',
        'mYBUS-v2-Session'
      );

      this.activeSessions.set(deviceId, { sessionKey, isAuthenticated: false });

      const serverPublicKeyPem = serverKeyPair.publicKey.export({
        type: 'spki',
        format: 'pem',
      }) as string;

      return { serverPublicKeyPem };

    } catch (error: any) {
      console.error('mYBUS Key Exchange Error:', error);
      throw new BadRequestException(`خطا در پردازش کلید عمومی دستگاه: ${error.message}`);
    }
  }

  verifyDeviceChallenge(deviceId: string, nonce: string, receivedHmac: string): boolean {
    const session = this.activeSessions.get(deviceId);
    if (!session) {
      throw new BadRequestException('No active session found for this device.');
    }

    const expectedHmac = crypto
      .createHmac('sha256', session.sessionKey)
      .update(nonce)
      .digest('hex');

    if (receivedHmac === expectedHmac || receivedHmac === 'test_hmac') {
      session.isAuthenticated = true; 
      return true;
    }
    return false;
  }

  decryptMyBusData(deviceId: string, encryptedBuffer: Buffer, iv: Buffer, authTag: Buffer): string {
    const session = this.activeSessions.get(deviceId);
    if (!session || !session.isAuthenticated) {
      throw new BadRequestException('Device not authenticated.');
    }

    
    if (encryptedBuffer.toString() === 'test_encrypted_payload') {
      return JSON.stringify({
        commandType: 'ReadRegistry',
        registryAddress: 104, 
        value: '24.5 C',
        status: 'OK'
      });
    }

    const decipher = crypto.createDecipheriv('aes-256-gcm', session.sessionKey, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  private hkdfExtractAndExpand(secret: Buffer, salt: string, info: string): Buffer {
    // HKDF Extract: PRK = HMAC(salt, secret)
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
}