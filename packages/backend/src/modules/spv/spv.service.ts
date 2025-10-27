import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CreateSpvDto, UpdateSpvDto, AddPropertyDto, UploadDocumentDto } from './dto';
import { createHash } from 'crypto';

@Injectable()
export class SpvService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async createSpv(dto: CreateSpvDto) {
    // Check if registration number already exists
    const existing = await this.prisma.sPV.findUnique({
      where: { registrationNumber: dto.registrationNumber },
    });

    if (existing) {
      throw new BadRequestException('SPV with this registration number already exists');
    }

    const spv = await this.prisma.sPV.create({
      data: {
        companyName: dto.companyName,
        jurisdiction: dto.jurisdiction,
        legalRepresentative: dto.legalRepresentative,
        registrationNumber: dto.registrationNumber,
        custodyAccount: dto.custodyAccount,
      },
    });

    return spv;
  }

  async getAllSpvs(limit = 50, offset = 0) {
    const [spvs, total] = await Promise.all([
      this.prisma.sPV.findMany({
        take: limit,
        skip: offset,
        include: {
          properties: true,
          _count: {
            select: {
              properties: true,
              documents: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sPV.count(),
    ]);

    return {
      spvs,
      total,
      limit,
      offset,
    };
  }

  async getSpvById(id: string) {
    const spv = await this.prisma.sPV.findUnique({
      where: { id },
      include: {
        properties: {
          include: {
            documents: true,
          },
        },
        documents: true,
        valuations: {
          orderBy: { valuationDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!spv) {
      throw new NotFoundException('SPV not found');
    }

    return spv;
  }

  async updateSpv(id: string, dto: UpdateSpvDto) {
    const spv = await this.prisma.sPV.update({
      where: { id },
      data: dto,
    });

    return spv;
  }

  async addProperty(spvId: string, dto: AddPropertyDto) {
    // Verify SPV exists
    const spv = await this.prisma.sPV.findUnique({
      where: { id: spvId },
    });

    if (!spv) {
      throw new NotFoundException('SPV not found');
    }

    const property = await this.prisma.property.create({
      data: {
        spvId,
        address: dto.address,
        type: dto.type,
        area: dto.area,
        purchasePrice: dto.purchasePrice,
        currentValue: dto.currentValue,
        occupancyRate: dto.occupancyRate,
        monthlyRent: dto.monthlyRent,
        lat: dto.lat,
        lon: dto.lon,
      },
    });

    return property;
  }

  async getProperties(spvId: string) {
    const properties = await this.prisma.property.findMany({
      where: { spvId },
      include: {
        documents: true,
      },
    });

    return properties;
  }

  async uploadDocument(spvId: string, dto: UploadDocumentDto, uploadedBy: string) {
    // Verify SPV exists
    const spv = await this.prisma.sPV.findUnique({
      where: { id: spvId },
    });

    if (!spv) {
      throw new NotFoundException('SPV not found');
    }

    // Upload to IPFS (simplified - in production use proper IPFS client)
    const ipfsHash = await this.uploadToIPFS(dto.file);
    
    // Generate onchain hash
    const onchainHash = createHash('sha256')
      .update(dto.file.toString())
      .digest('hex');

    const document = await this.prisma.document.create({
      data: {
        entityType: 'SPV',
        entityId: spvId,
        type: dto.type,
        ipfsHash,
        onchainHash: `0x${onchainHash}`,
        fileName: dto.fileName,
        fileSize: BigInt(dto.fileSize),
        uploadedBy,
      },
    });

    return document;
  }

  async getDocuments(spvId: string) {
    const documents = await this.prisma.document.findMany({
      where: {
        entityType: 'SPV',
        entityId: spvId,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return documents;
  }

  async getValuations(spvId: string) {
    const valuations = await this.prisma.valuation.findMany({
      where: { spvId },
      orderBy: { valuationDate: 'desc' },
      take: 50,
    });

    return valuations;
  }

  async addValuation(spvId: string, valuation: {
    value: number;
    lowerCI?: number;
    upperCI?: number;
    confidence?: number;
    modelVersion: string;
    valuationDate: Date;
  }) {
    const newValuation = await this.prisma.valuation.create({
      data: {
        spvId,
        value: valuation.value,
        lowerCI: valuation.lowerCI,
        upperCI: valuation.upperCI,
        confidence: valuation.confidence,
        modelVersion: valuation.modelVersion,
        valuationDate: valuation.valuationDate,
      },
    });

    return newValuation;
  }

  private async uploadToIPFS(file: Buffer): Promise<string> {
    // Simplified IPFS upload
    // In production, use ipfs-http-client or Pinata/Infura
    const ipfsUrl = this.configService.get<string>('IPFS_API_URL');
    
    try {
      // Mock IPFS hash for development
      const hash = createHash('sha256').update(file).digest('hex');
      return `Qm${hash.substring(0, 44)}`;
    } catch (error) {
      throw new BadRequestException('Failed to upload to IPFS');
    }
  }
}
