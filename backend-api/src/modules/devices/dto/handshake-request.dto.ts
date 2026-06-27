import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class HandshakeDataDto {
  @ApiProperty({ 
    required: false, 
    description: 'Device public key - Phase 1 (ECDH key exchange)' 
  })
  @IsString()
  @IsOptional()
  publicKeyPem?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Random nonce - Phase 2 (HMAC challenge)' 
  })
  @IsString()
  @IsOptional()
  nonce?: string;

  @ApiProperty({ 
    required: false, 
    description: 'HMAC signature - Phase 2 (Device authentication)' 
  })
  @IsString()
  @IsOptional() 
  hmac?: string;
}

export class HandshakeRequestDto {
  @ApiProperty({ example: 2, description: 'Protocol version' })
  @IsNumber()
  protocolVersion: number;

  @ApiProperty({ example: 1, description: 'Communication interface' })
  @IsNumber()
  communicationInterface: number;

  @ApiProperty({ example: 10, description: 'Zone ID' })
  @IsNumber()
  zoneId: number;

  @ApiProperty({ example: 'ESP32_ECOSMART_01', description: 'Device unique identifier' })
  @IsString()
  deviceId: string;

  @ApiProperty({ example: 1, description: 'Request sequence number' })
  @IsNumber()
  requestNumber: number;

  @ApiProperty({ example: 0, description: 'Control flags' })
  @IsNumber()
  flags: number;

  @ApiProperty({ 
    example: 1, 
    description: 'Security mode: 1=handshake (phase 1 or 2), 2=encrypted (phase 3)' 
  })
  @IsNumber()
  security: number;

  @ApiProperty({ example: 250, description: 'Command code' })
  @IsNumber()
  command: number;

  @ApiProperty({ 
    type: HandshakeDataDto, 
    description: 'Handshake payload data' 
  })
  @ValidateNested()
  @Type(() => HandshakeDataDto)
  data: HandshakeDataDto;
}