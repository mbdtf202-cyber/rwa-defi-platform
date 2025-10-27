import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StartKycDto } from './dto';

@Controller('kyc')
export class KycController {
  constructor(private kycService: KycService) {}

  @Post('start')
  @UseGuards(JwtAuthGuard)
  async startKyc(@Request() req, @Body() dto: StartKycDto) {
    return this.kycService.startKyc(req.user.id, dto.provider);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Request() req) {
    return this.kycService.getKycStatus(req.user.id);
  }

  @Post('webhook/:provider')
  async handleWebhook(@Param('provider') provider: string, @Body() payload: any) {
    return this.kycService.handleWebhook(provider, payload);
  }
}
