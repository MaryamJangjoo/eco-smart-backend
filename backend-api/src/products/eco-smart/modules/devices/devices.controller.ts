import { Controller, Post, Get, Body, Param, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { DeviceService } from './device.service';
import { MyBusSecurityService } from '../../../../infrastructure/mybus/mybus-security.service';
import { HandshakeRequestDto } from './dto/handshake-request.dto';
import { SecureDataRequestDto } from './dto/secure-data-request.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { Device } from './entities/device.entity';
import { DeviceAccessGuard } from './guards/device-access.guard';

@ApiTags('Devices')
@Controller('devices')
export class DevicesController {
  constructor(
    private readonly securityService: MyBusSecurityService,
    private readonly deviceService: DeviceService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new device' })
  async registerDevice(@Body() dto: RegisterDeviceDto): Promise<Device> {
    return this.deviceService.register(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices' })
  async getAllDevices(): Promise<Device[]> {
    return this.deviceService.findAll();
  }

  @Get(':deviceId')
  @ApiOperation({ summary: 'Get device by ID' })
  @UseGuards(DeviceAccessGuard) 
  async getDeviceById(@Param('deviceId') deviceId: string): Promise<Device> {
    return this.deviceService.findByDeviceId(deviceId);
  }

  @Post('handshake')
  @ApiOperation({ summary: 'Phase 1 & 2: ECDH Handshake and HMAC Challenge' })
  @ApiResponse({ status: 201, description: 'Handshake processed successfully.' })
  async handleHandshake(@Body() body: HandshakeRequestDto) { 
    const { security, deviceId, data } = body;

    if (security === 1 && data?.publicKeyPem) {
      return this.securityService.generateSessionKey(deviceId, data.publicKeyPem);
    } 
    
    if (security === 1 && data?.nonce && data?.hmac) {
      const isValid = this.securityService.verifyDeviceChallenge(deviceId, data.nonce, data.hmac);
      if (!isValid) {
        throw new BadRequestException('HMAC challenge verification failed.');
      }
      return {
        status: 'authenticated',
        message: 'mYBUS secure session established successfully.',
        isAuthenticated: true,
      };
    }

    throw new BadRequestException('Invalid handshake security structure or parameters missing.');
  }

  @Post('data')
  @ApiOperation({ summary: 'Phase 3: Secure Request/Response Packet Engine' })
  @UseGuards(DeviceAccessGuard) 
  async handleSecureData(@Body() body: SecureDataRequestDto) {
    if (body.security !== 2) {
      throw new BadRequestException('This endpoint only accepts encrypted packets with security=2.');
    }

    const { deviceId, data } = body;

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

      const myBusPayload = JSON.parse(decryptedPlaintext);
      let applicationResponse = {};

      switch (myBusPayload.action) {
        case 'READ': {
          const device = await this.deviceService.findByDeviceId(deviceId);
          applicationResponse = {
            action: 'READ_REPLY',
            registryAddress: myBusPayload.registryAddress,
            value: device.status === 'active' ? '24.5' : '0', 
            status: device.status
          };
          break;
        }

        case 'WRITE': {
          const updatedDevice = await this.deviceService.updateStatus(deviceId, 'active');
          applicationResponse = {
            action: 'WRITE_REPLY',
            registryAddress: myBusPayload.registryAddress,
            status: 'SUCCESS',
            message: `mYbus control packet executed. Device is now active.`
          };
          break;
        }

        default:
          throw new BadRequestException(`Action protocol '${myBusPayload.action}' is unsupported.`);
      }

      return {
        status: 'success',
        message: 'mYBUS application packet executed successfully.',
        deviceId,
        zoneId: body.zoneId,
        requestNumber: body.requestNumber,
        payloadResponse: applicationResponse
      };

    } catch (error: any) {
      throw new BadRequestException(`Application Layer Error: ${error.message}`);
    }
  }
}