import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'Acme Corp', description: 'Client/organization name' })
  @IsNotEmpty({ message: 'Client name cannot be empty.' })
  @IsString({ message: 'Client name must be a string.' })
  @Length(2, 150, { message: 'Client name must be between 2 and 150 characters.' })
  readonly name: string;
}