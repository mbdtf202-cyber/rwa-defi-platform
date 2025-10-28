import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { KycModule } from './modules/kyc/kyc.module';
import { SpvModule } from './modules/spv/spv.module';
import { TokenModule } from './modules/token/token.module';
import { PaymentModule } from './modules/payment/payment.module';
import { OracleModule } from './modules/oracle/oracle.module';
import { AuditModule } from './modules/audit/audit.module';
import { DocumentModule } from './modules/document/document.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UserModule,
    KycModule,
    SpvModule,
    TokenModule,
    PaymentModule,
    OracleModule,
    AuditModule,
    DocumentModule,
    BlockchainModule,
    MonitoringModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
