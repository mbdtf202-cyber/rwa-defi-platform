import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEnum(['INDIVIDUAL', 'INSTITUTIONAL'])
  userType?: 'INDIVIDUAL' | 'INSTITUTIONAL';
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
