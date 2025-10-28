import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { IpfsModule } from '../ipfs/ipfs.module';

@Module({
  imports: [PrismaModule, IpfsModule],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
