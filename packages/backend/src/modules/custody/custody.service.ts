import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FireblocksSDK, PeerType, TransactionOperation, TransactionStatus } from 'fireblocks-sdk';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CustodyService {
  private readonly logger = new Logger(CustodyService.name);
  private fireblocks: FireblocksSDK;
  private vaultAccountId: string;

  constructor(
    @Inject(ConfigService) private configService: ConfigService,
    @Inject(PrismaService) private prisma: PrismaService,
  ) {
    this.initializeFireblocks();
  }

  private initializeFireblocks() {
    try {
      const apiKey = this.configService.get<string>('FIREBLOCKS_API_KEY');
      const apiSecretPath = this.configService.get<string>('FIREBLOCKS_API_SECRET_PATH');
      this.vaultAccountId = this.configService.get<string>('FIREBLOCKS_VAULT_ACCOUNT_ID');

      if (!apiKey || !apiSecretPath) {
        this.logger.warn('Fireblocks credentials not configured. Custody service will be disabled.');
        return;
      }

      const apiSecret = fs.readFileSync(path.resolve(apiSecretPath), 'utf8');
      
      this.fireblocks = new FireblocksSDK(apiSecret, apiKey);
      this.logger.log('Fireblocks SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Fireblocks SDK', error);
    }
  }

  /**
   * Create a new transaction for signing
   */
  async createTransaction(params: {
    assetId: string;
    amount: string;
    destination: string;
    note?: string;
  }) {
    if (!this.fireblocks) {
      throw new BadRequestException('Fireblocks not configured');
    }

    try {
      const { assetId, amount, destination, note } = params;

      this.logger.log(`Creating Fireblocks transaction: ${amount} ${assetId} to ${destination}`);

      const transaction = await this.fireblocks.createTransaction({
        assetId,
        source: {
          type: PeerType.VAULT_ACCOUNT,
          id: this.vaultAccountId,
        },
        destination: {
          type: PeerType.EXTERNAL_WALLET,
          oneTimeAddress: {
            address: destination,
          },
        },
        amount,
        note: note || 'RWA Platform Transaction',
        operation: TransactionOperation.TRANSFER,
      });

      // Store transaction in database
      await this.prisma.custodyTransaction.create({
        data: {
          fireblocksId: transaction.id,
          assetId,
          amount,
          destination,
          status: transaction.status,
          note,
        },
      });

      this.logger.log(`Transaction created: ${transaction.id}`);

      return {
        id: transaction.id,
        status: transaction.status,
        txHash: transaction.txHash,
      };
    } catch (error) {
      this.logger.error('Failed to create transaction', error);
      throw new BadRequestException('Failed to create transaction');
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string) {
    if (!this.fireblocks) {
      throw new BadRequestException('Fireblocks not configured');
    }

    try {
      const transaction = await this.fireblocks.getTransactionById(transactionId);

      // Update database
      await this.prisma.custodyTransaction.update({
        where: { fireblocksId: transactionId },
        data: {
          status: transaction.status,
          txHash: transaction.txHash,
        },
      });

      return {
        id: transaction.id,
        status: transaction.status,
        txHash: transaction.txHash,
        createdAt: transaction.createdAt,
        lastUpdated: transaction.lastUpdated,
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction status: ${transactionId}`, error);
      throw new BadRequestException('Failed to get transaction status');
    }
  }

  /**
   * Cancel a pending transaction
   */
  async cancelTransaction(transactionId: string) {
    if (!this.fireblocks) {
      throw new BadRequestException('Fireblocks not configured');
    }

    try {
      await this.fireblocks.cancelTransactionById(transactionId);

      await this.prisma.custodyTransaction.update({
        where: { fireblocksId: transactionId },
        data: { status: TransactionStatus.CANCELLED },
      });

      this.logger.log(`Transaction cancelled: ${transactionId}`);

      return { success: true, message: 'Transaction cancelled' };
    } catch (error) {
      this.logger.error(`Failed to cancel transaction: ${transactionId}`, error);
      throw new BadRequestException('Failed to cancel transaction');
    }
  }

  /**
   * Get vault account balance
   */
  async getVaultBalance(assetId?: string) {
    if (!this.fireblocks) {
      throw new BadRequestException('Fireblocks not configured');
    }

    try {
      const vaultAccount = await this.fireblocks.getVaultAccountById(this.vaultAccountId);

      if (assetId) {
        const asset = vaultAccount.assets.find(a => a.id === assetId);
        return {
          assetId,
          balance: asset?.balance || '0',
          available: asset?.available || '0',
        };
      }

      return vaultAccount.assets.map(asset => ({
        assetId: asset.id,
        balance: asset.balance,
        available: asset.available,
      }));
    } catch (error) {
      this.logger.error('Failed to get vault balance', error);
      throw new BadRequestException('Failed to get vault balance');
    }
  }

  /**
   * Get vault account addresses
   */
  async getVaultAddresses(assetId: string) {
    if (!this.fireblocks) {
      throw new BadRequestException('Fireblocks not configured');
    }

    try {
      const addresses = await this.fireblocks.getDepositAddresses(
        this.vaultAccountId,
        assetId,
      );

      return addresses.map(addr => ({
        address: addr.address,
        tag: addr.tag,
        type: addr.type,
      }));
    } catch (error) {
      this.logger.error(`Failed to get vault addresses for ${assetId}`, error);
      throw new BadRequestException('Failed to get vault addresses');
    }
  }

  /**
   * Create a new deposit address
   */
  async createDepositAddress(assetId: string) {
    if (!this.fireblocks) {
      throw new BadRequestException('Fireblocks not configured');
    }

    try {
      const address = await this.fireblocks.generateNewAddress(
        this.vaultAccountId,
        assetId,
      );

      this.logger.log(`New deposit address created for ${assetId}: ${address.address}`);

      return {
        address: address.address,
        tag: address.tag,
        assetId,
      };
    } catch (error) {
      this.logger.error(`Failed to create deposit address for ${assetId}`, error);
      throw new BadRequestException('Failed to create deposit address');
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(params?: {
    limit?: number;
    before?: string;
    after?: string;
    status?: TransactionStatus;
  }) {
    if (!this.fireblocks) {
      throw new BadRequestException('Fireblocks not configured');
    }

    try {
      const transactions = await this.fireblocks.getTransactions({
        ...params,
        sourceType: PeerType.VAULT_ACCOUNT,
        sourceId: this.vaultAccountId,
      });

      return transactions.map(tx => ({
        id: tx.id,
        assetId: tx.assetId,
        amount: tx.amount,
        status: tx.status,
        txHash: tx.txHash,
        createdAt: tx.createdAt,
        destination: tx.destination,
      }));
    } catch (error) {
      this.logger.error('Failed to get transaction history', error);
      throw new BadRequestException('Failed to get transaction history');
    }
  }

  /**
   * Estimate transaction fee
   */
  async estimateFee(params: {
    assetId: string;
    amount: string;
    destination: string;
  }) {
    if (!this.fireblocks) {
      throw new BadRequestException('Fireblocks not configured');
    }

    try {
      const { assetId, amount, destination } = params;

      const estimate = await this.fireblocks.estimateFeeForTransaction({
        assetId,
        source: {
          type: PeerType.VAULT_ACCOUNT,
          id: this.vaultAccountId,
        },
        destination: {
          type: PeerType.EXTERNAL_WALLET,
          oneTimeAddress: {
            address: destination,
          },
        },
        amount,
        operation: TransactionOperation.TRANSFER,
      });

      return {
        low: estimate.low,
        medium: estimate.medium,
        high: estimate.high,
      };
    } catch (error) {
      this.logger.error('Failed to estimate fee', error);
      throw new BadRequestException('Failed to estimate fee');
    }
  }

  /**
   * Webhook handler for Fireblocks events
   */
  async handleWebhook(payload: any) {
    try {
      const { type, data } = payload;

      this.logger.log(`Received Fireblocks webhook: ${type}`);

      switch (type) {
        case 'TRANSACTION_CREATED':
        case 'TRANSACTION_STATUS_UPDATED':
          await this.handleTransactionUpdate(data);
          break;
        
        case 'TRANSACTION_APPROVAL_STATUS_UPDATED':
          await this.handleApprovalUpdate(data);
          break;
        
        default:
          this.logger.warn(`Unknown webhook type: ${type}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to handle webhook', error);
      throw error;
    }
  }

  private async handleTransactionUpdate(data: any) {
    const { id, status, txHash } = data;

    await this.prisma.custodyTransaction.update({
      where: { fireblocksId: id },
      data: {
        status,
        txHash,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Transaction ${id} updated: ${status}`);
  }

  private async handleApprovalUpdate(data: any) {
    const { id, approvalStatus } = data;

    this.logger.log(`Transaction ${id} approval status: ${approvalStatus}`);
    
    // Handle approval logic here
  }
}
