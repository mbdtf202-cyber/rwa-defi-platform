import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { OracleService } from './oracle.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('oracle')
export class OracleController {
  constructor(private oracleService: OracleService) {}

  @Post('collect/rent')
  @UseGuards(JwtAuthGuard)
  async collectRent(@Body('spvId') spvId: string) {
    return this.oracleService.collectRentData(spvId);
  }

  @Post('collect/valuation')
  @UseGuards(JwtAuthGuard)
  async collectValuation(@Body('spvId') spvId: string) {
    return this.oracleService.collectValuationData(spvId);
  }

  @Post('push')
  @UseGuards(JwtAuthGuard)
  async pushData(
    @Body('oracleAddress') oracleAddress: string,
    @Body('spvId') spvId: number,
    @Body('dataType') dataType: string,
    @Body('value') value: number,
  ) {
    return this.oracleService.pushDataToChain(oracleAddress, spvId, dataType, value);
  }

  @Get('value')
  async getValue(
    @Query('oracleAddress') oracleAddress: string,
    @Query('spvId') spvId: string,
    @Query('dataType') dataType: string,
  ) {
    return this.oracleService.getLatestValue(oracleAddress, parseInt(spvId), dataType);
  }

  @Get('stale')
  async checkStale(
    @Query('oracleAddress') oracleAddress: string,
    @Query('spvId') spvId: string,
    @Query('dataType') dataType: string,
  ) {
    return this.oracleService.checkStale(oracleAddress, parseInt(spvId), dataType);
  }

  @Post('aggregate')
  @UseGuards(JwtAuthGuard)
  async aggregateAndPush(
    @Body('spvId') spvId: string,
    @Body('dataType') dataType: 'RENT' | 'VALUATION',
  ) {
    return this.oracleService.aggregateAndPush(spvId, dataType);
  }
}
