import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';

@Module({
  imports: [HttpModule],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
