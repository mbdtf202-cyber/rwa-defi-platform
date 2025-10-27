import { Controller, Post, Get, Body, Headers, UseGuards, Request, Query, RawBodyRequest, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreatePaymentDto, ProcessCryptoDepositDto } from './dto';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('fiat/create')
  @UseGuards(JwtAuthGuard)
  async createPayment(@Request() req, @Body() dto: CreatePaymentDto) {
    return this.paymentService.createPaymentIntent(req.user.id, dto);
  }

  @Post('fiat/webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentService.handleStripeWebhook(signature, req.rawBody);
  }

  @Post('crypto/deposit')
  async processCryptoDeposit(@Body() dto: ProcessCryptoDepositDto) {
    return this.paymentService.processCryptoDeposit(dto);
  }

  @Post('withdraw')
  @UseGuards(JwtAuthGuard)
  async withdraw(
    @Request() req,
    @Body('amount') amount: number,
    @Body('tokenAddress') tokenAddress: string,
  ) {
    return this.paymentService.initiateWithdrawal(req.user.id, amount, tokenAddress);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.paymentService.getPaymentHistory(req.user.id, limit, offset);
  }
}
