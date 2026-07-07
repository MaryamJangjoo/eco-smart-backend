import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyPhoneDto {
  @ApiProperty({ example: '+989123456789', description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: '12345', description: 'OTP code' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}