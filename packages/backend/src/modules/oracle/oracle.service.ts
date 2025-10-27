import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ethers } from 'ethers';
import { firstValueFrom } from 'rxjs';
import { createHash } from 'crypto';

@Injectable()
export class OracleService {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    const rpcUrl = this.configService.get<string>('RPC_URL') || 'http://localhost:8545';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const privateKey = this.configService.get<string>('ORACLE_PRIVATE_KEY');
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
    }
  }

  async collectRentData(spvId: string) {
    // Collect rent data from multiple sources
    const sources = [
      this.getRentFromBank(spvId),
      this.getRentFromPropertyManagement(spvId),
    ];

    const results = await Promise.allSettled(sources);
    const validResults = results
      .filter((r) => r.status === 'fulfilled')
      .map((r: any) => r.value);

    if (validResults.length === 0) {
      throw new BadRequestException('No valid rent data sources');
    }

    // Calculate median
    const median = this.calculateMedian(validResults.map((r) => r.amount));

    return {
      spvId,
      dataType: 'RENT_CONFIRMATION',
      value: median,
      sources: validResults.length,
      timestamp: new Date(),
    };
  }

  async collectValuationData(spvId: string) {
    // Get valuation from ML service
    const mlServiceUrl = this.configService.get<string>('ML_SERVICE_URL');
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${mlServiceUrl}/api/v1/avm/${spvId}`),
      );

      return {
        spvId,
        dataType: 'NAV_VALUATION',
        value: response.data.value,
        lowerCI: response.data.lower_ci,
        upperCI: response.data.upper_ci,
        confidence: response.data.confidence,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get valuation: ${error.message}`);
    }
  }

  async pushDataToChain(
    oracleAddress: string,
    spvId: number,
    dataType: string,
    value: number,
  ) {
    if (!this.wallet) {
      throw new BadRequestException('Oracle wallet not configured');
    }

    const oracleContract = await this.getOracleContract(oracleAddress);

    // Generate signature
    const dataHash = ethers.solidityPackedKeccak256(
      ['uint256', 'bytes32', 'uint256', 'uint256'],
      [spvId, ethers.id(dataType), value, Math.floor(Date.now() / 1000)],
    );

    const signature = await this.wallet.signMessage(ethers.getBytes(dataHash));

    try {
      const tx = await oracleContract.updateValue(
        spvId,
        ethers.id(dataType),
        value,
        signature,
      );

      const receipt = await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        spvId,
        dataType,
        value,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to push data: ${error.message}`);
    }
  }

  async getLatestValue(oracleAddress: string, spvId: number, dataType: string) {
    const oracleContract = await this.getOracleContract(oracleAddress);

    try {
      const [value, timestamp] = await oracleContract.getLatestValue(
        spvId,
        ethers.id(dataType),
      );

      return {
        spvId,
        dataType,
        value: Number(value),
        timestamp: new Date(Number(timestamp) * 1000),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get value: ${error.message}`);
    }
  }

  async checkStale(oracleAddress: string, spvId: number, dataType: string) {
    const oracleContract = await this.getOracleContract(oracleAddress);

    try {
      const isStale = await oracleContract.isStale(spvId, ethers.id(dataType));
      return { spvId, dataType, isStale };
    } catch (error) {
      throw new BadRequestException(`Failed to check staleness: ${error.message}`);
    }
  }

  async aggregateAndPush(spvId: string, dataType: 'RENT' | 'VALUATION') {
    let data;

    if (dataType === 'RENT') {
      data = await this.collectRentData(spvId);
    } else {
      data = await this.collectValuationData(spvId);
    }

    // Push to blockchain
    const oracleAddress = this.configService.get<string>('ORACLE_CONTRACT_ADDRESS');
    if (oracleAddress) {
      await this.pushDataToChain(
        oracleAddress,
        parseInt(spvId),
        data.dataType,
        data.value,
      );
    }

    // Store in database for history
    if (dataType === 'VALUATION') {
      await this.prisma.valuation.create({
        data: {
          spvId,
          value: data.value,
          lowerCI: data.lowerCI,
          upperCI: data.upperCI,
          confidence: data.confidence,
          modelVersion: 'oracle-v1',
          valuationDate: new Date(),
        },
      });
    }

    return data;
  }

  private async getRentFromBank(spvId: string) {
    // Simplified bank API integration
    // In production, use proper bank API
    return {
      source: 'bank',
      amount: 10000,
      timestamp: new Date(),
    };
  }

  private async getRentFromPropertyManagement(spvId: string) {
    // Simplified property management API integration
    return {
      source: 'property_management',
      amount: 10050,
      timestamp: new Date(),
    };
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  private async getOracleContract(oracleAddress: string) {
    if (!this.wallet) {
      throw new BadRequestException('Wallet not configured');
    }

    const abi = [
      'function updateValue(uint256 spvId, bytes32 dataType, uint256 value, bytes signature) external',
      'function getLatestValue(uint256 spvId, bytes32 dataType) external view returns (uint256 value, uint256 timestamp)',
      'function isStale(uint256 spvId, bytes32 dataType) public view returns (bool)',
    ];

    return new ethers.Contract(oracleAddress, abi, this.wallet);
  }
}
