import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DocumentService } from './document.service';
import { Response } from 'express';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Query('spvId') spvId: string,
    @Query('documentType') documentType: string,
  ) {
    return this.documentService.uploadDocument(
      file.buffer,
      file.originalname,
      parseInt(spvId),
      documentType,
    );
  }

  @Post(':hash/store-proof')
  async storeProofOnChain(
    @Param('hash') hash: string,
    @Query('ipfsCid') ipfsCid: string,
    @Query('spvId') spvId: string,
    @Query('documentType') documentType: string,
  ) {
    return this.documentService.storeProofOnChain(
      hash,
      ipfsCid,
      parseInt(spvId),
      documentType,
    );
  }

  @Get(':hash/verify')
  async verifyDocument(@Param('hash') hash: string) {
    const isValid = await this.documentService.verifyDocument(hash);
    return { hash, verified: isValid };
  }

  @Get(':hash/download')
  async downloadDocument(@Param('hash') hash: string, @Res() res: Response) {
    const file = await this.documentService.downloadDocument(hash);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(file);
  }

  @Get('spv/:spvId')
  async getSPVDocuments(@Param('spvId') spvId: string) {
    return this.documentService.getSPVDocuments(parseInt(spvId));
  }
}
