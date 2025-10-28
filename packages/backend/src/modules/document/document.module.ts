import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { IpfsModule } from '../ipfs/ipfs.module';

@Module({
  imports: [ConfigModule, PrismaModule, IpfsModule],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
