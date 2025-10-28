import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { create, IPFSHTTPClient } from 'ipfs-http-client';
import * as crypto from 'crypto';

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  // private client: IPFSHTTPClient;

  constructor(private configService: ConfigService) {
    const ipfsUrl = this.configService.get<string>('IPFS_URL') || 'http://localhost:5001';
    // this.client = create({ url: ipfsUrl });
    this.logger.log(`IPFS client initialized (MOCK MODE): ${ipfsUrl}`);
  }

  async uploadFile(file: Buffer, filename: string): Promise<string> {
    try {
      // MOCK: Generate a fake CID for development
      const mockCid = `Qm${crypto.createHash('sha256').update(file).digest('hex').substring(0, 44)}`;
      
      this.logger.log(`File uploaded to IPFS (MOCK): ${mockCid}`);
      return mockCid;
    } catch (error) {
      this.logger.error(`Failed to upload file to IPFS: ${error.message}`);
      throw error;
    }
  }

  async downloadFile(cid: string): Promise<Buffer> {
    try {
      // MOCK: Return empty buffer for development
      const buffer = Buffer.from('Mock IPFS file content');
      this.logger.log(`File downloaded from IPFS (MOCK): ${cid}`);
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to download file from IPFS: ${error.message}`);
      throw error;
    }
  }

  async pinFile(cid: string): Promise<void> {
    try {
      // MOCK: No-op for development
      this.logger.log(`File pinned (MOCK): ${cid}`);
    } catch (error) {
      this.logger.error(`Failed to pin file: ${error.message}`);
      throw error;
    }
  }

  async unpinFile(cid: string): Promise<void> {
    try {
      // MOCK: No-op for development
      this.logger.log(`File unpinned (MOCK): ${cid}`);
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
      // MOCK: Return fake stats for development
      return {
        cid: cid,
        size: 1024,
        type: 'file',
      };
    } catch (error) {
      this.logger.error(`Failed to get file stats: ${error.message}`);
      throw error;
    }
  }
}
