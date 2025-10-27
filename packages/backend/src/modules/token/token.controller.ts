import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { TokenService } from './token.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MintTokenDto, BurnTokenDto, SetWhitelistDto, DistributeDividendsDto } from './dto';

@Controller('tokens')
@UseGuards(JwtAuthGuard)
export class TokenController {
  constructor(private tokenService: TokenService) {}

  @Post('mint')
  async mint(@Request() req, @Body() dto: MintTokenDto) {
    return this.tokenService.mintToken(dto, req.user.id);
  }

  @Post('burn')
  async burn(@Request() req, @Body() dto: BurnTokenDto) {
    return this.tokenService.burnToken(dto, req.user.id);
  }

  @Post('whitelist')
  async setWhitelist(@Request() req, @Body() dto: SetWhitelistDto) {
    return this.tokenService.setWhitelist(dto, req.user.id);
  }

  @Post('dividends/distribute')
  async distributeDividends(@Request() req, @Body() dto: DistributeDividendsDto) {
    return this.tokenService.distributeDividends(dto, req.user.id);
  }

  @Get('balance')
  async getBalance(
    @Query('tokenAddress') tokenAddress: string,
    @Query('userAddress') userAddress: string,
  ) {
    return this.tokenService.getBalance(tokenAddress, userAddress);
  }

  @Get('whitelist/check')
  async checkWhitelist(
    @Query('tokenAddress') tokenAddress: string,
    @Query('userAddress') userAddress: string,
  ) {
    return this.tokenService.isWhitelisted(tokenAddress, userAddress);
  }

  @Post('snapshot')
  async createSnapshot(
    @Request() req,
    @Body('tokenAddress') tokenAddress: string,
  ) {
    return this.tokenService.createSnapshot(tokenAddress, req.user.id);
  }
}
