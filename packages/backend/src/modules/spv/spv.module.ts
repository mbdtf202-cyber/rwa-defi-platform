import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SpvService } from './spv.service';
import { SpvController } from './spv.controller';

@Module({
  imports: [HttpModule],
  controllers: [SpvController],
  providers: [SpvService],
  exports: [SpvService],
})
export class SpvModule {}
