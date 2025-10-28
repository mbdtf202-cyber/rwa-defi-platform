import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ethers } from 'ethers';
import { MintTokenDto, BurnTokenDto, SetWhitelistDto, DistributeDividendsDto } from './dto';

@Injectable()
export class TokenService {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(ConfigService) private configService: ConfigService,
  ) {
    // Initialize blockchain connection
    const rpcUrl = this.configService.get<string>('RPC_URL') || 'http://localhost:8545';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
    }
  }

  async mintToken(dto: MintTokenDto, operatorId: string) {
    // Verify user is whitelisted
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.kycStatus !== 'APPROVED') {
      throw new BadRequestException('User KYC not approved');
    }

    if (!user.walletAddress) {
      throw new BadRequestException('User wallet not linked');
    }

    // Get token contract
    const tokenContract = await this.getTokenContract(dto.tokenAddress);

    try {
      // Call mint function
      const tx = await tokenContract.mint(
        user.walletAddress,
        ethers.parseEther(dto.amount.toString()),
      );

      // Create transaction record
      const transaction = await this.prisma.transaction.create({
        data: {
          userId: dto.userId,
          type: 'MINT',
          tokenAddress: dto.tokenAddress,
          amount: dto.amount,
          toAddress: user.walletAddress,
          txHash: tx.hash,
          status: 'PENDING',
        },
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      // Update transaction status
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'CONFIRMED',
          blockNumber: BigInt(receipt.blockNumber),
          confirmedAt: new Date(),
        },
      });

      return {
        transaction,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      throw new BadRequestException(`Mint failed: ${error.message}`);
    }
  }

  async burnToken(dto: BurnTokenDto, operatorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user || !user.walletAddress) {
      throw new BadRequestException('User not found or wallet not linked');
    }

    const tokenContract = await this.getTokenContract(dto.tokenAddress);

    try {
      const tx = await tokenContract.burn(
        user.walletAddress,
        ethers.parseEther(dto.amount.toString()),
      );

      const transaction = await this.prisma.transaction.create({
        data: {
          userId: dto.userId,
          type: 'BURN',
          tokenAddress: dto.tokenAddress,
          amount: dto.amount,
          fromAddress: user.walletAddress,
          txHash: tx.hash,
          status: 'PENDING',
        },
      });

      const receipt = await tx.wait();

      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'CONFIRMED',
          blockNumber: BigInt(receipt.blockNumber),
          confirmedAt: new Date(),
        },
      });

      return {
        transaction,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      throw new BadRequestException(`Burn failed: ${error.message}`);
    }
  }

  async setWhitelist(dto: SetWhitelistDto, operatorId: string) {
    const tokenContract = await this.getTokenContract(dto.tokenAddress);

    try {
      let tx;
      if (dto.addresses.length === 1) {
        tx = await tokenContract.setWhitelist(dto.addresses[0], dto.status);
      } else {
        tx = await tokenContract.setWhitelistBatch(dto.addresses, dto.status);
      }

      await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        addresses: dto.addresses,
        status: dto.status,
      };
    } catch (error) {
      throw new BadRequestException(`Whitelist update failed: ${error.message}`);
    }
  }

  async distributeDividends(dto: DistributeDividendsDto, operatorId: string) {
    const tokenContract = await this.getTokenContract(dto.tokenAddress);

    try {
      const tx = await tokenContract.distributeDividends(
        dto.dividendToken,
        ethers.parseEther(dto.amount.toString()),
      );

      await tx.wait();

      // Record dividend distribution
      // In production, create a Dividend table to track this

      return {
        success: true,
        txHash: tx.hash,
        amount: dto.amount,
        dividendToken: dto.dividendToken,
      };
    } catch (error) {
      throw new BadRequestException(`Dividend distribution failed: ${error.message}`);
    }
  }

  async getBalance(tokenAddress: string, userAddress: string) {
    const tokenContract = await this.getTokenContract(tokenAddress);

    try {
      const balance = await tokenContract.balanceOf(userAddress);
      return {
        tokenAddress,
        userAddress,
        balance: ethers.formatEther(balance),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get balance: ${error.message}`);
    }
  }

  async isWhitelisted(tokenAddress: string, userAddress: string) {
    const tokenContract = await this.getTokenContract(tokenAddress);

    try {
      const whitelisted = await tokenContract.isWhitelisted(userAddress);
      return {
        tokenAddress,
        userAddress,
        whitelisted,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to check whitelist: ${error.message}`);
    }
  }

  async createSnapshot(tokenAddress: string, operatorId: string) {
    const tokenContract = await this.getTokenContract(tokenAddress);

    try {
      const tx = await tokenContract.snapshot();
      const receipt = await tx.wait();

      // Parse snapshot event to get snapshot ID
      const snapshotEvent = receipt.logs.find(
        (log) => log.topics[0] === ethers.id('SnapshotCreated(uint256,uint256)'),
      );

      return {
        success: true,
        txHash: tx.hash,
        snapshotId: snapshotEvent ? parseInt(snapshotEvent.topics[1], 16) : null,
      };
    } catch (error) {
      throw new BadRequestException(`Snapshot creation failed: ${error.message}`);
    }
  }

  private async getTokenContract(tokenAddress: string) {
    if (!this.wallet) {
      throw new BadRequestException('Wallet not configured');
    }

    // Simplified ABI - in production, import full ABI
    const abi = [
      'function mint(address to, uint256 amount) external',
      'function burn(address from, uint256 amount) external',
      'function setWhitelist(address account, bool status) external',
      'function setWhitelistBatch(address[] accounts, bool status) external',
      'function distributeDividends(address dividendToken, uint256 amount) external',
      'function balanceOf(address account) view returns (uint256)',
      'function isWhitelisted(address account) view returns (bool)',
      'function snapshot() external returns (uint256)',
    ];

    return new ethers.Contract(tokenAddress, abi, this.wallet);
  }

  async listenToEvents(tokenAddress: string) {
    const tokenContract = await this.getTokenContract(tokenAddress);

    // Listen to Transfer events
    tokenContract.on('Transfer', async (from, to, amount, event) => {
      console.log(`Transfer: ${from} -> ${to}, amount: ${ethers.formatEther(amount)}`);
      
      // Update database
      // In production, implement proper event handling
    });

    // Listen to Mint events
    tokenContract.on('Mint', async (to, amount, spvId, event) => {
      console.log(`Mint: ${to}, amount: ${ethers.formatEther(amount)}, SPV: ${spvId}`);
    });
  }
}
