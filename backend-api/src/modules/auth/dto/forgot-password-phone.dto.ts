import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ForgotPasswordPhoneDto {
  @ApiProperty({ example: '+989123456789', description: 'User phone number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+98|0)?9\d{9}$/, { message: 'Invalid phone number format' }) 
  phoneNumber: string;
}