import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 100)
  password: string;
}

