import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('logs')
  async getLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.auditService.getLogs({
      userId,
      action,
      resource,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    });
  }

  @Post('export')
  async exportLogs(
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
    @Body('format') format?: 'CSV' | 'JSON',
  ) {
    return this.auditService.exportLogs({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      format,
    });
  }

  @Get('statistics')
  async getStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.auditService.getStatistics(
      new Date(startDate),
      new Date(endDate),
    );
  }
}
