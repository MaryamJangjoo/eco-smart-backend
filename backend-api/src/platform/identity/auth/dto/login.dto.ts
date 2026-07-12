import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'testuser8', description: 'Username' })
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  username: string;

  @ApiProperty({ example: 'Test@123456', description: 'Password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}