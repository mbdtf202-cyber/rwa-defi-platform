import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MarketplaceService } from './marketplace.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('marketplace')
@UseGuards(JwtAuthGuard)
export class MarketplaceController {
  constructor(private marketplaceService: MarketplaceService) {}

  @Post('order')
  async createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.marketplaceService.createOrder(req.user.id, dto);
  }

  @Delete('order/:orderId')
  async cancelOrder(@Req() req: any, @Param('orderId') orderId: string) {
    return this.marketplaceService.cancelOrder(req.user.id, orderId);
  }

  @Get('orderbook')
  async getOrderBook(@Query('tokenAddress') tokenAddress: string) {
    return this.marketplaceService.getOrderBook(tokenAddress);
  }

  @Get('orders')
  async getUserOrders(@Req() req: any) {
    return this.marketplaceService.getUserOrders(req.user.id);
  }

  @Get('trades')
  async getTrades(
    @Query('tokenAddress') tokenAddress: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketplaceService.getTrades(
      tokenAddress,
      limit ? parseInt(limit) : 50,
    );
  }
}
