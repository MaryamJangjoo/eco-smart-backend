import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MyBusSecurityService } from './mybus-security.service';
import { HandshakeRequestDto } from './dto/handshake-request.dto';
import { SecureDataRequestDto } from './dto/secure-data-request.dto';

@ApiTags('Devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly securityService: MyBusSecurityService) {}

  @Post('handshake')
  @ApiOperation({ summary: 'Phase 1 & 2: ECDH Handshake and HMAC Challenge' })
  @ApiResponse({ status: 200, description: 'Handshake successful' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async handleHandshake(@Body() body: HandshakeRequestDto) {
    if (body.security === 1 && body.data?.publicKeyPem) {
      const { serverPublicKeyPem } = this.securityService.generateSessionKey(
        body.deviceId,
        body.data.publicKeyPem
      );
      return {
        status: 'handshake_initiated',
        serverPublicKeyPem,
        message: 'ECDH key exchange completed. Proceed to challenge phase.',
      };
    }

    if (body.security === 1 && body.data?.nonce && body.data?.hmac) {
      const isValid = this.securityService.verifyDeviceChallenge(
        body.deviceId,
        body.data.nonce,
        body.data.hmac
      );

      if (!isValid) {
        throw new BadRequestException('HMAC authentication failed. Device identity not verified.');
      }

      return {
        status: 'authenticated',
        message: 'mYBUS secure session established successfully.',
        isAuthenticated: true,
      };
    }

    throw new BadRequestException(
      'Invalid mYBUS handshake frame format. Expected security=1 with publicKeyPem or nonce+hmac.'
    );
  }

  @Post('data')
  @ApiOperation({ summary: 'Phase 3: Send encrypted mYBUS data (AES-256-GCM)' })
  @ApiResponse({ status: 200, description: 'Data decrypted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid encrypted data' })
  async handleSecureData(@Body() body: SecureDataRequestDto) {
    if (body.security !== 2) {
      throw new BadRequestException(
        'This endpoint only accepts encrypted packets with security=2.'
      );
    }

    const { deviceId, data } = body;

    if (!data?.encryptedData || !data?.iv || !data?.authTag) {
      throw new BadRequestException(
        'Missing required AES-GCM parameters: encryptedData, IV, or AuthTag.'
      );
    }

    try {
      const encryptedBuffer = Buffer.from(data.encryptedData, 'hex');
      const ivBuffer = Buffer.from(data.iv, 'hex');
      const authTagBuffer = Buffer.from(data.authTag, 'hex');

      const decryptedPlaintext = this.securityService.decryptMyBusData(
        deviceId,
        encryptedBuffer,
        ivBuffer,
        authTagBuffer
      );

      const myBusCommand = JSON.parse(decryptedPlaintext);

      return {
        status: 'success',
        message: 'mYBUS packet successfully decrypted and authenticated.',
        parsedCommand: myBusCommand,
      };

    } catch (error) {
      throw new BadRequestException(
        'Decryption failed. Session key may be expired or data has been tampered with.'
      );
    }
  }
}