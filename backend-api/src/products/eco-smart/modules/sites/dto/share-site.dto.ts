import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class ShareSiteDto {
  @IsNotEmpty({ message: 'Site ID is required.' })
  @IsUUID('4', { message: 'Site ID must be a valid UUID.' })
  siteId: string;

  @IsNotEmpty({ message: 'Recipient email is required.' })
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email: string;
}