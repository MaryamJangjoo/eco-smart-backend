import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSiteDto {
  @ApiProperty({ example: 'Downtown HQ', description: 'Site name' })
  @IsNotEmpty({ message: 'Site name cannot be empty.' })
  @IsString({ message: 'Site name must be a string.' })
  @Length(3, 100, { message: 'Site name must be between 3 and 100 characters.' })
  name: string;

  @ApiProperty({
    example: '018f67c2-1234-7000-8000-000000000001',
    description: 'ID of the Client this site belongs to. The requesting user must own this client.',
  })
  @IsNotEmpty({ message: 'Client ID is required.' })
  @IsUUID('4', { message: 'Client ID must be a valid UUID.' })
  clientId: string;
}