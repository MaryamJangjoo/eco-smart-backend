import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/roles.enum';

export class RegisterDto {
  @ApiProperty({ example: 'operator_shiraz' })
  @IsString()
  @IsNotEmpty()
  readonly username: string;

  @ApiProperty({ example: 'operator@ecosmart.com' })
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty({ example: '+989123456789' })
  @IsString()
  @IsNotEmpty()
  readonly phoneNumber: string;

  @ApiProperty({ example: 'Maryam' })
  @IsString()
  @IsNotEmpty()
  readonly firstName: string;

  @ApiProperty({ example: 'Jangjoo' })
  @IsString()
  @IsNotEmpty()
  readonly lastName: string;

  @ApiProperty({ example: 'Shiraz, University Blvd...' })
  @IsString()
  @IsNotEmpty()
  readonly address: string;

  @ApiProperty({ example: '7134512345' })
  @IsString()
  @IsNotEmpty()
  readonly postalCode: string;

  @ApiProperty({ example: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...' })
  @IsString()
  @IsNotEmpty()
  readonly publicKey: string;

  @ApiProperty({ example: 'SecurePassword@2026' })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  readonly password: string;

  @ApiProperty({ enum: UserRole, default: UserRole.USER, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  readonly role?: UserRole;
}