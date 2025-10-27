import { Controller, Get, Put, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateProfileDto, LinkWalletDto } from './dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.userService.getProfile(req.user.id);
  }

  @Put('profile')
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  @Post('wallet/link')
  async linkWallet(@Request() req, @Body() dto: LinkWalletDto) {
    return this.userService.linkWallet(req.user.id, dto);
  }

  @Get('transactions')
  async getTransactions(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.userService.getTransactions(req.user.id, limit, offset);
  }

  @Get('holdings')
  async getHoldings(@Request() req) {
    return this.userService.getHoldings(req.user.id);
  }
}
