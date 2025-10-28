import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CostBasisMethod, TaxJurisdiction } from './dto/tax-report.dto';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async generateYearlyReport(
    userId: string,
    year: number,
    method: CostBasisMethod,
    jurisdiction: TaxJurisdiction,
  ) {
    return {
      userId,
      year,
      method,
      jurisdiction,
      capitalGains: [],
      dividends: [],
      totalTaxLiability: 0,
    };
  }

  async calculateCapitalGains(
    userId: string,
    year: number,
    method: CostBasisMethod,
  ) {
    return [];
  }

  async calculateDividends(userId: string, year: number) {
    return [];
  }
}
