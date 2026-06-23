import { IsString, IsEnum, MinLength, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../../common/enums/roles.enum';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Username cannot be empty' })
  username: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsEnum(UserRole, { message: 'Invalid user role' })
  role: UserRole;
}