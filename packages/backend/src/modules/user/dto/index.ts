import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsEnum(['INDIVIDUAL', 'INSTITUTIONAL'])
  userType?: 'INDIVIDUAL' | 'INSTITUTIONAL';
}

export class LinkWalletDto {
  @IsString()
  walletAddress: string;

  @IsString()
  signature: string;

  @IsOptional()
  @IsString()
  message?: string;
}
