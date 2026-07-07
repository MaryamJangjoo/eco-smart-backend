import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateSiteDto {
  @IsNotEmpty({ message: 'Site name cannot be empty.' })
  @IsString({ message: 'Site name must be a string.' })
  @Length(3, 100, { message: 'Site name must be between 3 and 100 characters.' })
  name: string;
}