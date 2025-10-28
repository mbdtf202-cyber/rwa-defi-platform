import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainSyncService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainSyncService.name);
  private provider: ethers.Provider;
  private contracts: Map<string, ethers.Contract> = new Map();
  private syncInterval: NodeJS.Timeout;
  private lastSyncedBlock: number = 0;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const rpcUrl = this.configService.get<string>('BLOCKCHAIN_RPC_URL');
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async onModuleInit() {
    await this.initializeContracts();
    await this.loadLastSyncedBlock();
    this.startSync();
  }

  private async initializeContracts() {
    const contractAddresses = {
      permissionedToken: this.configService.get<string>('PERMISSIONED_TOKEN_ADDRESS'),
      spvRegistry: this.configService.get<string>('SPV_REGISTRY_ADDRESS'),
      vault: this.configService.get<string>('VAULT_ADDRESS'),
      lendingPool: this.configService.get<string>('LENDING_POOL_ADDRESS'),
      amm: this.configService.get<string>('PERMISSIONED_AMM_ADDRESS'),
      documentRegistry: this.configService.get<string>('DOCUMENT_REGISTRY_ADDRESS'),
    };

    // Load ABIs and create contract instances
    for (const [name, address] of Object.entries(contractAddresses)) {
      if (address) {
        try {
          const abi = await this.loadABI(name);
          const contract = new ethers.Contract(address, abi, this.provider);
          this.contracts.set(name, contract);
          this.logger.log(`Initialized contract: ${name} at ${address}`);
        } catch (error) {
          this.logger.error(`Failed to initialize contract ${name}:`, error);
        }
      }
    }
  }

  private async loadABI(contractName: string): Promise<any[]> {
    // Load ABI from artifacts
    const fs = require('fs');
    const path = require('path');
    
    const artifactPath = path.join(
      __dirname,
      '../../../contracts/artifacts/contracts',
      `${this.capitalize(contractName)}.sol`,
      `${this.capitalize(contractName)}.json`
    );

    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      return artifact.abi;
    }

    throw new Error(`ABI not found for ${contractName}`);
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private async loadLastSyncedBlock() {
    try {
      const syncState = await this.prisma.syncState.findFirst({
        orderBy: { blockNumber: 'desc' },
      });

      if (syncState) {
        this.lastSyncedBlock = syncState.blockNumber;
        this.logger.log(`Resuming sync from block ${this.lastSyncedBlock}`);
      } else {
        const currentBlock = await this.provider.getBlockNumber();
        this.lastSyncedBlock = currentBlock - 1000; // Start from 1000 blocks ago
        this.logger.log(`Starting fresh sync from block ${this.lastSyncedBlock}`);
      }
    } catch (error) {
      this.logger.error('Failed to load last synced block:', error);
      const currentBlock = await this.provider.getBlockNumber();
      this.lastSyncedBlock = currentBlock - 100;
    }
  }

  private startSync() {
    this.logger.log('Starting blockchain sync service');
    
    // Sync every 15 seconds
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncBlocks();
      } catch (error) {
        this.logger.error('Sync error:', error);
      }
    }, 15000);

    // Initial sync
    this.syncBlocks();
  }

  private async syncBlocks() {
    const currentBlock = await this.provider.getBlockNumber();
    
    if (currentBlock <= this.lastSyncedBlock) {
      return; // Already synced
    }

    const fromBlock = this.lastSyncedBlock + 1;
    const toBlock = Math.min(fromBlock + 100, currentBlock); // Sync 100 blocks at a time

    this.logger.log(`Syncing blocks ${fromBlock} to ${toBlock}`);

    for (const [name, contract] of this.contracts.entries()) {
      try {
        await this.syncContractEvents(name, contract, fromBlock, toBlock);
      } catch (error) {
        this.logger.error(`Failed to sync ${name}:`, error);
      }
    }

    // Update last synced block
    this.lastSyncedBlock = toBlock;
    await this.saveSyncState(toBlock);
  }

  private async syncContractEvents(
    contractName: string,
    contract: ethers.Contract,
    fromBlock: number,
    toBlock: number,
  ) {
    const filter = {
      address: await contract.getAddress(),
      fromBlock,
      toBlock,
    };

    const logs = await this.provider.getLogs(filter);

    for (const log of logs) {
      try {
        const parsedLog = contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });

        if (parsedLog) {
          await this.processEvent(contractName, parsedLog, log);
        }
      } catch (error) {
        this.logger.warn(`Failed to parse log:`, error);
      }
    }
  }

  private async processEvent(
    contractName: string,
    event: ethers.LogDescription,
    log: ethers.Log,
  ) {
    this.logger.debug(`Processing event: ${contractName}.${event.name}`);

    switch (contractName) {
      case 'permissionedToken':
        await this.processTokenEvent(event, log);
        break;
      case 'spvRegistry':
        await this.processSPVEvent(event, log);
        break;
      case 'vault':
        await this.processVaultEvent(event, log);
        break;
      case 'lendingPool':
        await this.processLendingEvent(event, log);
        break;
      case 'amm':
        await this.processAMMEvent(event, log);
        break;
      case 'documentRegistry':
        await this.processDocumentEvent(event, log);
        break;
    }
  }

  private async processTokenEvent(event: ethers.LogDescription, log: ethers.Log) {
    const eventName = event.name;

    switch (eventName) {
      case 'Transfer':
        await this.prisma.transaction.create({
          data: {
            type: 'TRANSFER',
            fromAddress: event.args.from,
            toAddress: event.args.to,
            amount: event.args.value.toString(),
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            status: 'CONFIRMED',
          },
        });
        break;

      case 'TokensMinted':
        await this.prisma.transaction.create({
          data: {
            type: 'MINT',
            toAddress: event.args.to,
            amount: event.args.amount.toString(),
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            status: 'CONFIRMED',
          },
        });
        break;

      case 'TokensBurned':
        await this.prisma.transaction.create({
          data: {
            type: 'BURN',
            fromAddress: event.args.from,
            amount: event.args.amount.toString(),
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            status: 'CONFIRMED',
          },
        });
        break;
    }
  }

  private async processSPVEvent(event: ethers.LogDescription, log: ethers.Log) {
    if (event.name === 'SPVRegistered') {
      // Update SPV status in database
      this.logger.log(`SPV registered: ${event.args.spvId}`);
    }
  }

  private async processVaultEvent(event: ethers.LogDescription, log: ethers.Log) {
    switch (event.name) {
      case 'Deposit':
        this.logger.log(`Vault deposit: ${event.args.amount}`);
        break;
      case 'Withdraw':
        this.logger.log(`Vault withdraw: ${event.args.amount}`);
        break;
    }
  }

  private async processLendingEvent(event: ethers.LogDescription, log: ethers.Log) {
    switch (event.name) {
      case 'Borrow':
        this.logger.log(`Borrow: ${event.args.amount}`);
        break;
      case 'Repay':
        this.logger.log(`Repay: ${event.args.amount}`);
        break;
      case 'Liquidation':
        this.logger.log(`Liquidation: ${event.args.borrower}`);
        break;
    }
  }

  private async processAMMEvent(event: ethers.LogDescription, log: ethers.Log) {
    switch (event.name) {
      case 'Swap':
        this.logger.log(`Swap: ${event.args.amountIn} -> ${event.args.amountOut}`);
        break;
      case 'LiquidityAdded':
        this.logger.log(`Liquidity added: ${event.args.amount0}, ${event.args.amount1}`);
        break;
    }
  }

  private async processDocumentEvent(event: ethers.LogDescription, log: ethers.Log) {
    if (event.name === 'DocumentRegistered') {
      this.logger.log(`Document registered: ${event.args.documentId}`);
    }
  }

  private async saveSyncState(blockNumber: number) {
    await this.prisma.syncState.create({
      data: {
        blockNumber,
        timestamp: new Date(),
      },
    });
  }

  async getSyncStatus() {
    const currentBlock = await this.provider.getBlockNumber();
    return {
      lastSyncedBlock: this.lastSyncedBlock,
      currentBlock,
      blocksBehind: currentBlock - this.lastSyncedBlock,
      syncing: currentBlock > this.lastSyncedBlock,
    };
  }

  onModuleDestroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}
