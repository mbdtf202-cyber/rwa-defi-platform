import { Controller, Get, Query } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(private monitoringService: MonitoringService) {}

  @Get('metrics')
  async getMetrics() {
    return this.monitoringService.collectAllMetrics();
  }

  @Get('health')
  async getHealth() {
    return this.monitoringService.getSystemHealth();
  }

  @Get('alerts')
  async getAlerts(@Query('severity') severity?: string) {
    return this.monitoringService.getActiveAlerts(severity);
  }

  @Get('stats')
  async getStats(@Query('period') period: string = '24h') {
    return this.monitoringService.getStatistics(period);
  }
}
