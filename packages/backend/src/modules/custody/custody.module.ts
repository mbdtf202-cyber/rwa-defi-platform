import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustodyService } from './custody.service';
import { CustodyController } from './custody.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [CustodyController],
  providers: [CustodyService],
  exports: [CustodyService],
})
export class CustodyModule {}
