import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'test_operator' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'test@ecosmart.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+989123456789' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: 'Test' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'User' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Tehran, Iran', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '1234567890', required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: '-----BEGIN PUBLIC KEY-----...', required: false })
  @IsString()
  @IsOptional()
  publicKey?: string;

  @ApiProperty({ example: 'SecurePassword@2026' })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

}