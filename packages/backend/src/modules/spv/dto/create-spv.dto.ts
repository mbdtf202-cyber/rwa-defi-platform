import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSpvDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  jurisdiction: string;

  @IsString()
  @IsNotEmpty()
  legalRepresentative: string;

  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @IsString()
  @IsOptional()
  custodyAccount?: string;

  @IsString()
  @IsOptional()
  tokenAddress?: string;
}
