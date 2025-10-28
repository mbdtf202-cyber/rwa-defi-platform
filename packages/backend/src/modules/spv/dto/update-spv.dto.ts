import { IsString, IsOptional } from 'class-validator';

export class UpdateSpvDto {
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  jurisdiction?: string;

  @IsString()
  @IsOptional()
  legalRepresentative?: string;

  @IsString()
  @IsOptional()
  custodyAccount?: string;

  @IsString()
  @IsOptional()
  tokenAddress?: string;
}
