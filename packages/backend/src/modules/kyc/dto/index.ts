import { IsEnum, IsOptional } from 'class-validator';

export class StartKycDto {
  @IsOptional()
  @IsEnum(['ONFIDO', 'PERSONA', 'SUMSUB'])
  provider?: 'ONFIDO' | 'PERSONA' | 'SUMSUB';
}
