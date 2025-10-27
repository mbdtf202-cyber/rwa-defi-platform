import { IsString, IsNumber, IsBoolean, IsArray, IsEthereumAddress } from 'class-validator';

export class MintTokenDto {
  @IsString()
  userId: string;

  @IsEthereumAddress()
  tokenAddress: string;

  @IsNumber()
  amount: number;
}

export class BurnTokenDto {
  @IsString()
  userId: string;

  @IsEthereumAddress()
  tokenAddress: string;

  @IsNumber()
  amount: number;
}

export class SetWhitelistDto {
  @IsEthereumAddress()
  tokenAddress: string;

  @IsArray()
  @IsEthereumAddress({ each: true })
  addresses: string[];

  @IsBoolean()
  status: boolean;
}

export class DistributeDividendsDto {
  @IsEthereumAddress()
  tokenAddress: string;

  @IsEthereumAddress()
  dividendToken: string;

  @IsNumber()
  amount: number;
}
