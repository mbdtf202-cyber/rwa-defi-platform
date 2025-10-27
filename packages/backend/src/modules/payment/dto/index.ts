import { IsString, IsNumber, IsOptional, IsBoolean, IsEthereumAddress } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEthereumAddress()
  tokenAddress: string;
}

export class ProcessCryptoDepositDto {
  @IsEthereumAddress()
  fromAddress: string;

  @IsEthereumAddress()
  tokenAddress: string;

  @IsNumber()
  amount: number;

  @IsString()
  txHash: string;

  @IsOptional()
  @IsBoolean()
  shouldMint?: boolean;

  @IsOptional()
  @IsEthereumAddress()
  mintTokenAddress?: string;
}
