import { IsEnum, IsNumber, IsString, Min } from 'class-validator';

export enum OrderType {
  BUY = 'BUY',
  SELL = 'SELL',
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export class CreateOrderDto {
  @IsString()
  tokenAddress: string;

  @IsEnum(OrderType)
  type: OrderType;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  amount: number;
}
