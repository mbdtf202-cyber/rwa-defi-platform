import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { IpfsService } from '../ipfs/ipfs.service';
import { ethers } from 'ethers';

@Injectable()
export class DocumentService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor(
    private prisma: PrismaService,
    private ipfsService: IpfsService,
  ) {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contractAddress = process.env.DOCUMENT_REGISTRY_ADDRESS;
    const abi = [
      'function storeDocument(bytes32 documentHash, bytes32 ipfsHash, uint256 spvId, string documentType)',
      'function verifyDocument(bytes32 documentHash)',
      'function getDocument(bytes32 documentHash) view returns (tuple(bytes32 ipfsHash, uint256 spvId, string documentType, uint256 timestamp, address uploader, bool verified))',
      'function getSPVDocuments(uint256 spvId) view returns (bytes32[])',
    ];
    this.contract = new ethers.Contract(contractAddress, abi, this.provider);
  }

  async uploadDocument(
    file: Buffer,
    filename: string,
    spvId: number,
    documentType: string,
  ) {
    const fileHash = this.ipfsService.calculateFileHash(file);
    const ipfsCid = await this.ipfsService.uploadFile(file, filename);

    const documentHash = ethers.keccak256(ethers.toUtf8Bytes(fileHash));
    const ipfsHash = ethers.keccak256(ethers.toUtf8Bytes(ipfsCid));

    const document = await this.prisma.document.create({
      data: {
        hash: documentHash,
        ipfsHash: ipfsCid,
        spvId,
        documentType,
        filename,
        fileHash,
        verified: false,
      },
    });

    return {
      id: document.id,
      hash: documentHash,
      ipfsCid,
      fileHash,
      spvId,
      documentType,
    };
  }

  async storeProofOnChain(
    documentHash: string,
    ipfsCid: string,
    spvId: number,
    documentType: string,
  ) {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    const contractWithSigner = this.contract.connect(wallet);

    const ipfsHash = ethers.keccak256(ethers.toUtf8Bytes(ipfsCid));

    const tx = await contractWithSigner.storeDocument(
      documentHash,
      ipfsHash,
      spvId,
      documentType,
    );

    const receipt = await tx.wait();

    await this.prisma.document.updateMany({
      where: { hash: documentHash },
      data: { 
        onChain: true,
        txHash: receipt.hash,
      },
    });

    return receipt;
  }

  async verifyDocument(hash: string): Promise<boolean> {
    const document = await this.prisma.document.findFirst({
      where: { hash },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const isValid = await this.ipfsService.verifyFile(
      document.ipfsHash,
      document.fileHash,
    );

    if (isValid) {
      await this.prisma.document.update({
        where: { id: document.id },
        data: { verified: true },
      });
    }

    return isValid;
  }

  async downloadDocument(hash: string): Promise<Buffer> {
    const document = await this.prisma.document.findFirst({
      where: { hash },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.ipfsService.downloadFile(document.ipfsHash);
  }

  async getSPVDocuments(spvId: number) {
    return this.prisma.document.findMany({
      where: { spvId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
