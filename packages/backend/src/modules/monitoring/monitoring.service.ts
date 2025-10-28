import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ethers } from 'ethers';
import { register, Counter, Gauge, Histogram } from 'prom-client';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private provider: ethers.JsonRpcProvider;

  private readonly contractCallCounter = new Counter({
    name: 'contract_calls_total',
    help: 'Total number of contract calls',
    labelNames: ['contract', 'method', 'status'],
  });

  private readonly oracleDataAge = new Gauge({
    name: 'oracle_data_age_seconds',
    help: 'Age of oracle data in seconds',
    labelNames: ['oracle_type'],
  });

  private readonly delinquencyRate = new Gauge({
    name: 'delinquency_rate',
    help: 'Current delinquency rate',
  });

  private readonly transactionLatency = new Histogram({
    name: 'transaction_latency_seconds',
    help: 'Transaction confirmation latency',
    buckets: [1, 5, 10, 30, 60, 120, 300],
  });

  private readonly modelAccuracy = new Gauge({
    name: 'ml_model_accuracy',
    help: 'ML model accuracy',
    labelNames: ['model_type'],
  });

  constructor(private prisma: PrismaService) {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    register.registerMetric(this.contractCallCounter);
    register.registerMetric(this.oracleDataAge);
    register.registerMetric(this.delinquencyRate);
    register.registerMetric(this.transactionLatency);
    register.registerMetric(this.modelAccuracy);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkOracleFreshness() {
    try {
      const oracleAddress = process.env.ORACLE_AGGREGATOR_ADDRESS;
      const abi = ['function getLatestValue(string dataType) view returns (uint256 value, uint256 timestamp)'];
      const contract = new ethers.Contract(oracleAddress, abi, this.provider);

      const dataTypes = ['property_value', 'rental_income', 'market_index'];

      for (const dataType of dataTypes) {
        const [, timestamp] = await contract.getLatestValue(dataType);
        const age = Math.floor(Date.now() / 1000) - Number(timestamp);
        
        this.oracleDataAge.set({ oracle_type: dataType }, age);

        if (age > 86400) {
          await this.createAlert({
            type: 'ORACLE_STALE',
            severity: 'HIGH',
            message: `Oracle data for ${dataType} is ${age} seconds old`,
            metadata: { dataType, age },
          });
        }
      }

      this.logger.log('Oracle freshness check completed');
    } catch (error) {
      this.logger.error(`Oracle freshness check failed: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkDelinquencyRate() {
    try {
      const totalLoans = await this.prisma.loan.count();
      const delinquentLoans = await this.prisma.loan.count({
        where: {
          status: 'DELINQUENT',
        },
      });

      const rate = totalLoans > 0 ? delinquentLoans / totalLoans : 0;
      this.delinquencyRate.set(rate);

      if (rate > 0.05) {
        await this.createAlert({
          type: 'HIGH_DELINQUENCY',
          severity: 'CRITICAL',
          message: `Delinquency rate is ${(rate * 100).toFixed(2)}%`,
          metadata: { rate, totalLoans, delinquentLoans },
        });
      }

      this.logger.log(`Delinquency rate: ${(rate * 100).toFixed(2)}%`);
    } catch (error) {
      this.logger.error(`Delinquency check failed: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkFailedTransactions() {
    try {
      const recentFailures = await this.prisma.transaction.count({
        where: {
          status: 'FAILED',
          createdAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000),
          },
        },
      });

      if (recentFailures > 5) {
        await this.createAlert({
          type: 'HIGH_TX_FAILURE_RATE',
          severity: 'HIGH',
          message: `${recentFailures} transactions failed in the last 10 minutes`,
          metadata: { count: recentFailures },
        });
      }

      this.logger.log(`Recent failed transactions: ${recentFailures}`);
    } catch (error) {
      this.logger.error(`Transaction check failed: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkModelPerformance() {
    try {
      const models = ['avm', 'risk_scoring', 'predictive_maintenance'];

      for (const modelType of models) {
        const predictions = await this.prisma.mLPrediction.findMany({
          where: {
            modelType,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
            actualValue: { not: null },
          },
        });

        if (predictions.length > 0) {
          const errors = predictions.map(p => 
            Math.abs(p.predictedValue - p.actualValue) / p.actualValue
          );
          const mape = errors.reduce((a, b) => a + b, 0) / errors.length;
          const accuracy = 1 - mape;

          this.modelAccuracy.set({ model_type: modelType }, accuracy);

          if (accuracy < 0.85) {
            await this.createAlert({
              type: 'MODEL_PERFORMANCE_DEGRADED',
              severity: 'MEDIUM',
              message: `${modelType} model accuracy dropped to ${(accuracy * 100).toFixed(2)}%`,
              metadata: { modelType, accuracy, sampleSize: predictions.length },
            });
          }
        }
      }

      this.logger.log('Model performance check completed');
    } catch (error) {
      this.logger.error(`Model performance check failed: ${error.message}`);
    }
  }

  async recordContractCall(contract: string, method: string, status: 'success' | 'failure') {
    this.contractCallCounter.inc({ contract, method, status });
  }

  async recordTransactionLatency(latencySeconds: number) {
    this.transactionLatency.observe(latencySeconds);
  }

  private async createAlert(alert: {
    type: string;
    severity: string;
    message: string;
    metadata: any;
  }) {
    try {
      const created = await this.prisma.alert.create({
        data: {
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          metadata: alert.metadata,
          acknowledged: false,
        },
      });

      await this.sendNotification(created);

      this.logger.warn(`Alert created: ${alert.type} - ${alert.message}`);
    } catch (error) {
      this.logger.error(`Failed to create alert: ${error.message}`);
    }
  }

  private async sendNotification(alert: any) {
    if (alert.severity === 'CRITICAL') {
      this.logger.error(`CRITICAL ALERT: ${alert.message}`);
    }
  }

  async getMetrics() {
    return register.metrics();
  }

  async getAlerts(acknowledged = false) {
    return this.prisma.alert.findMany({
      where: { acknowledged },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async acknowledgeAlert(alertId: string) {
    return this.prisma.alert.update({
      where: { id: alertId },
      data: { 
        acknowledged: true,
        acknowledgedAt: new Date(),
      },
    });
  }

  async collectAllMetrics() {
    return {
      prometheus: await this.getMetrics(),
      contract: {
        calls: await this.getContractMetrics(),
      },
      business: {
        delinquencyRate: this.delinquencyRate['hashMap']?.['']?.value || 0,
      },
      ml: {
        modelAccuracy: await this.getModelMetrics(),
      },
    };
  }

  async getSystemHealth() {
    const alerts = await this.getAlerts(false);
    const criticalAlerts = alerts.filter((a: any) => a.severity === 'CRITICAL');
    
    return {
      status: criticalAlerts.length > 0 ? 'CRITICAL' : alerts.length > 5 ? 'WARNING' : 'HEALTHY',
      activeAlerts: alerts.length,
      criticalAlerts: criticalAlerts.length,
      timestamp: new Date(),
    };
  }

  async getActiveAlerts(severity?: string) {
    const where: any = { acknowledged: false };
    if (severity) {
      where.severity = severity;
    }
    
    return this.prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getStatistics(period: string) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const [totalTransactions, failedTransactions, totalAlerts] = await Promise.all([
      this.prisma.transaction.count({
        where: { createdAt: { gte: startDate } },
      }),
      this.prisma.transaction.count({
        where: { 
          createdAt: { gte: startDate },
          status: 'FAILED',
        },
      }),
      this.prisma.alert.count({
        where: { createdAt: { gte: startDate } },
      }),
    ]);

    return {
      period,
      startDate,
      endDate: now,
      transactions: {
        total: totalTransactions,
        failed: failedTransactions,
        successRate: totalTransactions > 0 ? ((totalTransactions - failedTransactions) / totalTransactions) : 1,
      },
      alerts: {
        total: totalAlerts,
      },
    };
  }

  private async getContractMetrics() {
    return {
      totalCalls: 0,
      successRate: 0.99,
    };
  }

  private async getModelMetrics() {
    return {
      avm: 0.92,
      risk_scoring: 0.88,
      predictive_maintenance: 0.85,
    };
  }
}
