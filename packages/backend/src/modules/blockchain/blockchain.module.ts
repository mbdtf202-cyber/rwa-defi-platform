import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { BlockchainListenerService } from './blockchain-listener.service';
import { BlockchainProcessorService } from './blockchain-processor.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    BullModule.registerQueue({
      name: 'blockchain-events',
    }),
  ],
  providers: [BlockchainListenerService, BlockchainProcessorService],
  exports: [BlockchainListenerService],
})
export class BlockchainModule {}
