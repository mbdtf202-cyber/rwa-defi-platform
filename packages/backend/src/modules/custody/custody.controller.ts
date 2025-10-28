import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CustodyService } from './custody.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/v1/custody')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustodyController {
  constructor(private readonly custodyService: CustodyService) {}

  @Post('transactions')
  @Roles('ADMIN', 'OPERATOR')
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(
    @Body()
    body: {
      assetId: string;
      amount: string;
      destination: string;
      note?: string;
    },
  ) {
    return this.custodyService.createTransaction(body);
  }

  @Get('transactions/:id')
  @Roles('ADMIN', 'OPERATOR', 'AUDITOR')
  async getTransactionStatus(@Param('id') id: string) {
    return this.custodyService.getTransactionStatus(id);
  }

  @Post('transactions/:id/cancel')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async cancelTransaction(@Param('id') id: string) {
    return this.custodyService.cancelTransaction(id);
  }

  @Get('balance')
  @Roles('ADMIN', 'OPERATOR', 'AUDITOR')
  async getVaultBalance(@Query('assetId') assetId?: string) {
    return this.custodyService.getVaultBalance(assetId);
  }

  @Get('addresses/:assetId')
  @Roles('ADMIN', 'OPERATOR')
  async getVaultAddresses(@Param('assetId') assetId: string) {
    return this.custodyService.getVaultAddresses(assetId);
  }

  @Post('addresses/:assetId')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createDepositAddress(@Param('assetId') assetId: string) {
    return this.custodyService.createDepositAddress(assetId);
  }

  @Get('transactions')
  @Roles('ADMIN', 'OPERATOR', 'AUDITOR')
  async getTransactionHistory(
    @Query('limit') limit?: number,
    @Query('before') before?: string,
    @Query('after') after?: string,
    @Query('status') status?: string,
  ) {
    return this.custodyService.getTransactionHistory({
      limit,
      before,
      after,
      status: status as any,
    });
  }

  @Post('estimate-fee')
  @Roles('ADMIN', 'OPERATOR')
  @HttpCode(HttpStatus.OK)
  async estimateFee(
    @Body()
    body: {
      assetId: string;
      amount: string;
      destination: string;
    },
  ) {
    return this.custodyService.estimateFee(body);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    return this.custodyService.handleWebhook(payload);
  }
}
