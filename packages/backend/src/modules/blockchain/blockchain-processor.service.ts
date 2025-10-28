import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

interface BlockchainEvent {
  eventType: string;
  data: any;
  timestamp: Date;
}

@Processor('blockchain-events')
@Injectable()
export class BlockchainProcessorService {
  private readonly logger = new Logger(BlockchainProcessorService.name);

  constructor(private prisma: PrismaService) {}

  @Process('Transfer')
  async processTransfer(job: Job<BlockchainEvent>) {
    const { data } = job.data;
    this.logger.log(`Processing Transfer event: ${data.transactionHash}`);

    try {
      // Check idempotency
      const existing = await this.prisma.blockchainEvent.findFirst({
        where: {
          transactionHash: data.transactionHash,
          eventType: 'Transfer',
        },
      });

      if (existing?.processed) {
        this.logger.log('Event already processed, skipping');
        return;
      }

      // Update token holdings
      if (data.from !== '0x0000000000000000000000000000000000000000') {
        await this.prisma.tokenHolding.updateMany({
          where: {
            userAddress: data.from.toLowerCase(),
          },
          data: {
            balance: { decrement: parseFloat(data.value) },
          },
        });
      }

      if (data.to !== '0x0000000000000000000000000000000000000000') {
        const holding = await this.prisma.tokenHolding.findFirst({
          where: {
            userAddress: data.to.toLowerCase(),
          },
        });

        if (holding) {
          await this.prisma.tokenHolding.update({
            where: { id: holding.id },
            data: {
              balance: { increment: parseFloat(data.value) },
            },
          });
        } else {
          await this.prisma.tokenHolding.create({
            data: {
              userAddress: data.to.toLowerCase(),
              tokenAddress: data.tokenAddress || '',
              balance: parseFloat(data.value),
            },
          });
        }
      }

      // Mark as processed
      await this.markEventProcessed(data.transactionHash, 'Transfer', data);
      this.logger.log('Transfer event processed successfully');
    } catch (error) {
      this.logger.error(`Failed to process Transfer event: ${error.message}`);
      throw error;
    }
  }

  @Process('DividendDistributed')
  async processDividendDistributed(job: Job<BlockchainEvent>) {
    const { data } = job.data;
    this.logger.log(`Processing DividendDistributed event: ${data.transactionHash}`);

    try {
      const existing = await this.prisma.blockchainEvent.findFirst({
        where: {
          transactionHash: data.transactionHash,
          eventType: 'DividendDistributed',
        },
      });

      if (existing?.processed) {
        this.logger.log('Event already processed, skipping');
        return;
      }

      // Record dividend distribution
      await this.prisma.dividendDistribution.create({
        data: {
          tokenAddress: data.token,
          amount: parseFloat(data.amount),
          timestamp: new Date(parseInt(data.timestamp) * 1000),
          txHash: data.transactionHash,
        },
      });

      // Send notifications to token holders
      // This would integrate with a notification service

      await this.markEventProcessed(data.transactionHash, 'DividendDistributed', data);
      this.logger.log('DividendDistributed event processed successfully');
    } catch (error) {
      this.logger.error(`Failed to process DividendDistributed event: ${error.message}`);
      throw error;
    }
  }

  @Process('VaultDeposit')
  async processVaultDeposit(job: Job<BlockchainEvent>) {
    const { data } = job.data;
    this.logger.log(`Processing VaultDeposit event: ${data.transactionHash}`);

    try {
      const existing = await this.prisma.blockchainEvent.findFirst({
        where: {
          transactionHash: data.transactionHash,
          eventType: 'VaultDeposit',
        },
      });

      if (existing?.processed) {
        return;
      }

      // Update vault position
      const position = await this.prisma.vaultPosition.findFirst({
        where: {
          userAddress: data.user.toLowerCase(),
        },
      });

      if (position) {
        await this.prisma.vaultPosition.update({
          where: { id: position.id },
          data: {
            shares: { increment: parseFloat(data.shares) },
            deposited: { increment: parseFloat(data.amount) },
          },
        });
      } else {
        await this.prisma.vaultPosition.create({
          data: {
            userAddress: data.user.toLowerCase(),
            shares: parseFloat(data.shares),
            deposited: parseFloat(data.amount),
          },
        });
      }

      await this.markEventProcessed(data.transactionHash, 'VaultDeposit', data);
      this.logger.log('VaultDeposit event processed successfully');
    } catch (error) {
      this.logger.error(`Failed to process VaultDeposit event: ${error.message}`);
      throw error;
    }
  }

  @Process('VaultWithdraw')
  async processVaultWithdraw(job: Job<BlockchainEvent>) {
    const { data } = job.data;
    this.logger.log(`Processing VaultWithdraw event: ${data.transactionHash}`);

    try {
      const existing = await this.prisma.blockchainEvent.findFirst({
        where: {
          transactionHash: data.transactionHash,
          eventType: 'VaultWithdraw',
        },
      });

      if (existing?.processed) {
        return;
      }

      await this.prisma.vaultPosition.updateMany({
        where: {
          userAddress: data.user.toLowerCase(),
        },
        data: {
          shares: { decrement: parseFloat(data.shares) },
        },
      });

      await this.markEventProcessed(data.transactionHash, 'VaultWithdraw', data);
      this.logger.log('VaultWithdraw event processed successfully');
    } catch (error) {
      this.logger.error(`Failed to process VaultWithdraw event: ${error.message}`);
      throw error;
    }
  }

  @Process('TrancheCreated')
  async processTrancheCreated(job: Job<BlockchainEvent>) {
    const { data } = job.data;
    this.logger.log(`Processing TrancheCreated event: ${data.transactionHash}`);

    try {
      const existing = await this.prisma.blockchainEvent.findFirst({
        where: {
          transactionHash: data.transactionHash,
          eventType: 'TrancheCreated',
        },
      });

      if (existing?.processed) {
        return;
      }

      // Create tranche records
      for (let i = 0; i < data.trancheTokens.length; i++) {
        await this.prisma.tranche.create({
          data: {
            spvId: data.spvId,
            tokenAddress: data.trancheTokens[i],
            priority: data.priorities[i],
            name: `Tranche ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
          },
        });
      }

      await this.markEventProcessed(data.transactionHash, 'TrancheCreated', data);
      this.logger.log('TrancheCreated event processed successfully');
    } catch (error) {
      this.logger.error(`Failed to process TrancheCreated event: ${error.message}`);
      throw error;
    }
  }

  @Process('SPVRegistered')
  async processSPVRegistered(job: Job<BlockchainEvent>) {
    const { data } = job.data;
    this.logger.log(`Processing SPVRegistered event: ${data.transactionHash}`);

    try {
      const existing = await this.prisma.blockchainEvent.findFirst({
        where: {
          transactionHash: data.transactionHash,
          eventType: 'SPVRegistered',
        },
      });

      if (existing?.processed) {
        return;
      }

      // Update SPV with on-chain ID
      await this.prisma.sPV.updateMany({
        where: {
          name: data.name,
        },
        data: {
          onChainId: parseInt(data.spvId),
          txHash: data.transactionHash,
        },
      });

      await this.markEventProcessed(data.transactionHash, 'SPVRegistered', data);
      this.logger.log('SPVRegistered event processed successfully');
    } catch (error) {
      this.logger.error(`Failed to process SPVRegistered event: ${error.message}`);
      throw error;
    }
  }

  private async markEventProcessed(txHash: string, eventType: string, data: any) {
    await this.prisma.blockchainEvent.upsert({
      where: {
        transactionHash_eventType: {
          transactionHash: txHash,
          eventType,
        },
      },
      create: {
        transactionHash: txHash,
        eventType,
        eventData: data,
        processed: true,
        processedAt: new Date(),
      },
      update: {
        processed: true,
        processedAt: new Date(),
      },
    });
  }
}
