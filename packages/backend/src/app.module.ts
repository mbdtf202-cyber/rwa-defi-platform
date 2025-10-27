import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { KycModule } from './modules/kyc/kyc.module';
import { SpvModule } from './modules/spv/spv.module';
import { TokenModule } from './modules/token/token.module';
import { PaymentModule } from './modules/payment/payment.module';
import { OracleModule } from './modules/oracle/oracle.module';
import { AuditModule } from './modules/audit/audit.module';
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    KycModule,
    SpvModule,
    TokenModule,
    PaymentModule,
    OracleModule,
    AuditModule,
  ],
})
export class AppModule {}
