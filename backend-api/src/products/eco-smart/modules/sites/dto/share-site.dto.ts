import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsUUID } from 'class-validator';

export class ShareSiteDto {
  @ApiProperty({ example: 'site-001' })
  @IsUUID()
  @IsNotEmpty()
  siteId: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}