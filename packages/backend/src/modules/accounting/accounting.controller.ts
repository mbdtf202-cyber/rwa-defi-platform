import { Controller, Get, Post, Query, Param, UseGuards, Req, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountingService } from './accounting.service';
import { CostBasisMethod, TaxJurisdiction } from './dto/tax-report.dto';
import { Response } from 'express';

@Controller('accounting')
@UseGuards(JwtAuthGuard)
export class AccountingController {
  constructor(private accountingService: AccountingService) {}

  @Get(':userId/yearly-report')
  async getYearlyReport(
    @Param('userId') userId: string,
    @Query('year') year: string,
    @Query('method') method: CostBasisMethod,
    @Query('jurisdiction') jurisdiction: TaxJurisdiction,
  ) {
    return this.accountingService.generateYearlyReport(
      userId,
      parseInt(year),
      method,
      jurisdiction,
    );
  }

  @Get(':userId/capital-gains')
  async getCapitalGains(
    @Param('userId') userId: string,
    @Query('year') year: string,
  ) {
    return this.accountingService.getCapitalGains(userId, parseInt(year));
  }

  @Get(':userId/dividends')
  async getDividends(
    @Param('userId') userId: string,
    @Query('year') year: string,
  ) {
    return this.accountingService.getDividends(userId, parseInt(year));
  }

  @Get(':userId/pdf-report')
  async downloadPDFReport(
    @Param('userId') userId: string,
    @Query('year') year: string,
    @Query('jurisdiction') jurisdiction: TaxJurisdiction,
    @Res() res: Response,
  ) {
    const pdf = await this.accountingService.generatePDFReport(
      userId,
      parseInt(year),
      jurisdiction,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=tax-report-${year}.pdf`);
    res.send(pdf);
  }
}
