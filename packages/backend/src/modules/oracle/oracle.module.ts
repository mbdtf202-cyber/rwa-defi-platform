import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OracleService } from './oracle.service';
import { OracleController } from './oracle.controller';

@Module({
  imports: [HttpModule],
  controllers: [OracleController],
  providers: [OracleService],
  exports: [OracleService],
})
export class OracleModule {}
