import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ 
    example: 'test2@example.com or +989123456788', 
    description: 'Email or phone number' 
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ 
    example: '12345', 
    description: '5-digit reset code' 
  })
  @IsString()
  @IsNotEmpty()
  token: string;  

  @ApiProperty({ example: 'NewTest@123456' })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  newPassword: string;
}