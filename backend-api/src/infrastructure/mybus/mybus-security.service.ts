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

    } catch (error: unknown) {  
      console.error('mYBUS Key Exchange Error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to process device public key: ${message}`);
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

    try {
      const isValid = crypto.timingSafeEqual(
        Buffer.from(receivedHmac, 'hex'),
        Buffer.from(expectedHmac, 'hex')
      );

      if (isValid) {
        session.isAuthenticated = true;
        return true;
      }
      return false;
    } catch (error: unknown) {
      return false;
    }
  }

  decryptMyBusData(deviceId: string, encryptedBuffer: Buffer, iv: Buffer, authTag: Buffer): string {
    const session = this.activeSessions.get(deviceId);
    if (!session || !session.isAuthenticated) {
      throw new BadRequestException('Device not authenticated.');
    }

    if (iv.length !== 12) {
      throw new BadRequestException('Invalid IV length. Expected 12 bytes.');
    }

    if (authTag.length !== 16) {
      throw new BadRequestException('Invalid auth tag length. Expected 16 bytes.');
    }

    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', session.sessionKey, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final(),
      ]);

      const plainText = decrypted.toString('utf8');

      try {
        JSON.parse(plainText);
      } catch {
        throw new BadRequestException('Decrypted payload is not valid JSON.');
      }

      return plainText;

    } catch (error: unknown) {  
      console.error('Decryption error:', error);
      const message = error instanceof Error ? error.message : 'Decryption failed';
      throw new BadRequestException(`Failed to decrypt data: ${message}`);
    }
  }

  encryptMyBusData(deviceId: string, plainText: string): { encryptedData: string; iv: string; authTag: string } {
    const session = this.activeSessions.get(deviceId);
    if (!session || !session.isAuthenticated) {
      throw new BadRequestException('Device not authenticated.');
    }

    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', session.sessionKey, iv);

      const encrypted = Buffer.concat([
        cipher.update(plainText, 'utf8'),
        cipher.final(),
      ]);

      const authTag = cipher.getAuthTag();

      return {
        encryptedData: encrypted.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
      };

    } catch (error: unknown) {  
      console.error('Encryption error:', error);
      const message = error instanceof Error ? error.message : 'Encryption failed';
      throw new BadRequestException(`Failed to encrypt data: ${message}`);
    }
  }

  clearSession(deviceId: string): void {
    this.activeSessions.delete(deviceId);
  }

  isAuthenticated(deviceId: string): boolean {
    const session = this.activeSessions.get(deviceId);
    return !!session?.isAuthenticated;
  }

  private hkdfExtractAndExpand(secret: Buffer, salt: string, info: string): Buffer {
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