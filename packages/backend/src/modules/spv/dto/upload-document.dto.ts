import { IsString, IsNotEmpty, IsEnum, IsNumber } from 'class-validator';

export enum DocumentType {
  DEED = 'DEED',
  LEASE = 'LEASE',
  AUDIT = 'AUDIT',
  REGISTRATION = 'REGISTRATION',
  OTHER = 'OTHER',
}

export class UploadDocumentDto {
  @IsEnum(DocumentType)
  type: DocumentType;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsNumber()
  fileSize: number;

  file: Buffer;
}
