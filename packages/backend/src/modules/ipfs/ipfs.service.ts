import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { create, IPFSHTTPClient } from 'ipfs-http-client';
import * as crypto from 'crypto';

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  private client: IPFSHTTPClient;

  constructor(private configService: ConfigService) {
    const ipfsUrl = this.configService.get<string>('IPFS_URL') || 'http://localhost:5001';
    this.client = create({ url: ipfsUrl });
    this.logger.log(`IPFS client initialized: ${ipfsUrl}`);
  }

  async uploadFile(file: Buffer, filename: string): Promise<string> {
    try {
      const result = await this.client.add({
        path: filename,
        content: file,
      });

      // Pin the file to ensure it stays available
      await this.pinFile(result.cid.toString());

      this.logger.log(`File uploaded to IPFS: ${result.cid.toString()}`);
      return result.cid.toString();
    } catch (error) {
      this.logger.error(`Failed to upload file to IPFS: ${error.message}`);
      throw error;
    }
  }

  async downloadFile(cid: string): Promise<Buffer> {
    try {
      const chunks: Uint8Array[] = [];
      
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      this.logger.log(`File downloaded from IPFS: ${cid}`);
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to download file from IPFS: ${error.message}`);
      throw error;
    }
  }

  async pinFile(cid: string): Promise<void> {
    try {
      await this.client.pin.add(cid);
      this.logger.log(`File pinned: ${cid}`);
    } catch (error) {
      this.logger.error(`Failed to pin file: ${error.message}`);
      throw error;
    }
  }

  async unpinFile(cid: string): Promise<void> {
    try {
      await this.client.pin.rm(cid);
      this.logger.log(`File unpinned: ${cid}`);
    } catch (error) {
      this.logger.error(`Failed to unpin file: ${error.message}`);
      throw error;
    }
  }

  calculateFileHash(file: Buffer): string {
    return crypto.createHash('sha256').update(file).digest('hex');
  }

  async verifyFile(cid: string, expectedHash: string): Promise<boolean> {
    try {
      const file = await this.downloadFile(cid);
      const actualHash = this.calculateFileHash(file);
      return actualHash === expectedHash;
    } catch (error) {
      this.logger.error(`Failed to verify file: ${error.message}`);
      return false;
    }
  }

  async getFileStats(cid: string) {
    try {
      const stats = await this.client.files.stat(`/ipfs/${cid}`);
      return {
        cid: stats.cid.toString(),
        size: stats.size,
        type: stats.type,
      };
    } catch (error) {
      this.logger.error(`Failed to get file stats: ${error.message}`);
      throw error;
    }
  }
}
