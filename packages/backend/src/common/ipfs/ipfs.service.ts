import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import * as FormData from 'form-data';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class IpfsService {
  private readonly ipfsApiUrl: string;
  private readonly ipfsGatewayUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.ipfsApiUrl = this.configService.get<string>('IPFS_API_URL') || 'https://ipfs.infura.io:5001/api/v0';
    this.ipfsGatewayUrl = this.configService.get<string>('IPFS_GATEWAY_URL') || 'https://ipfs.io/ipfs';
  }

  async uploadFile(file: Buffer, fileName: string): Promise<{ hash: string; url: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file, fileName);

      const response = await firstValueFrom(
        this.httpService.post(`${this.ipfsApiUrl}/add`, formData, {
          headers: formData.getHeaders(),
        }),
      );

      const hash = response.data.Hash;
      const url = `${this.ipfsGatewayUrl}/${hash}`;

      return { hash, url };
    } catch (error) {
      throw new BadRequestException('Failed to upload file to IPFS');
    }
  }

  async pinFile(hash: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.ipfsApiUrl}/pin/add?arg=${hash}`),
      );
    } catch (error) {
      throw new BadRequestException('Failed to pin file on IPFS');
    }
  }

  async getFile(hash: string): Promise<Buffer> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.ipfsGatewayUrl}/${hash}`, {
          responseType: 'arraybuffer',
        }),
      );

      return Buffer.from(response.data);
    } catch (error) {
      throw new BadRequestException('Failed to retrieve file from IPFS');
    }
  }

  generateFileHash(file: Buffer): string {
    return createHash('sha256').update(file).digest('hex');
  }

  verifyFile(file: Buffer, expectedHash: string): boolean {
    const actualHash = this.generateFileHash(file);
    return actualHash === expectedHash;
  }
}
