import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum PropertyType {
  COMMERCIAL = 'COMMERCIAL',
  RESIDENTIAL = 'RESIDENTIAL',
  MIXED = 'MIXED',
}

export class AddPropertyDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsEnum(PropertyType)
  type: PropertyType;

  @IsNumber()
  area: number;

  @IsNumber()
  purchasePrice: number;

  @IsNumber()
  @IsOptional()
  currentValue?: number;

  @IsNumber()
  @IsOptional()
  occupancyRate?: number;

  @IsNumber()
  @IsOptional()
  monthlyRent?: number;

  @IsNumber()
  @IsOptional()
  lat?: number;

  @IsNumber()
  @IsOptional()
  lon?: number;
}