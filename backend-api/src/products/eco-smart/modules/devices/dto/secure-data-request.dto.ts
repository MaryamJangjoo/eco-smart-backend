import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SecureDataDto {
  @ApiProperty({ example: '3ea2f682056df692a71b4cf1', description: 'Initialization Vector (Hex)' })
  @IsString()
  iv: string;

  @ApiProperty({ example: 'c192b67fa9d012e456bcfd39ab124312', description: 'AES-GCM Auth Tag (Hex)' })
  @IsString()
  authTag: string;

  @ApiProperty({ example: '746573745f656e637279707465645f7061796c6f6164', description: 'Encrypted Data (Hex)' })
  @IsString()
  encryptedData: string;
}

export class SecureDataRequestDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  protocolVersion: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  communicationInterface: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  zoneId: number;

  @ApiProperty({ example: 'ESP32_ECOSMART_01' })
  @IsString()
  deviceId: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  requestNumber: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  flags: number;

  @ApiProperty({ example: 2 }) 
  @IsNumber()
  security: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  command: number;

  @ApiProperty({ type: SecureDataDto })
  @ValidateNested()
  @Type(() => SecureDataDto)
  data: SecureDataDto;
}