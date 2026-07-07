import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({ description: 'Unique device identifier' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ description: 'Device serial number' })
  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @ApiProperty({ description: 'Device name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Device model', required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ description: 'Firmware version', required: false })
  @IsString()
  @IsOptional()
  firmwareVersion?: string;
}