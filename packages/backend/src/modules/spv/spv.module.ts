import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SpvController } from './spv.controller';
import { SpvService } from './spv.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [SpvController],
  providers: [SpvService],
  exports: [SpvService],
})
export class SpvModule {}
