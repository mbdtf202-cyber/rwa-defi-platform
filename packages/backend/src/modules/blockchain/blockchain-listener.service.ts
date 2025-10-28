import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class BlockchainListenerService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainListenerService.name);
  private provider: ethers.JsonRpcProvider;
  private contracts: Map<string, ethers.Contract> = new Map();

  constructor(
    @Inject(ConfigService) private configService: ConfigService,
    @InjectQueue('blockchain-events') private eventQueue: Queue,
  ) {
    this.provider = new ethers.JsonRpcProvider(
      this.configService.get<string>('RPC_URL'),
    );
  }

  async onModuleInit() {
    await this.setupListeners();
  }

  private async setupListeners() {
    await this.listenToPermissionedToken();
    await this.listenToVault();
    await this.listenToTrancheFactory();
    await this.listenToSPVRegistry();
    this.logger.log('Blockchain listeners initialized');
  }

  private async listenToPermissionedToken() {
    const address = this.configService.get<string>('PERMISSIONED_TOKEN_ADDRESS');
    const abi = [
      'event Transfer(address indexed from, address indexed to, uint256 value)',
      'event DividendDistributed(address indexed token, uint256 amount, uint256 timestamp)',
      'event TokensMinted(address indexed to, uint256 amount)',
      'event TokensBurned(address indexed from, uint256 amount)',
    ];

    const contract = new ethers.Contract(address, abi, this.provider);
    this.contracts.set('PermissionedToken', contract);

    contract.on('Transfer', async (from, to, value, event) => {
      await this.enqueueEvent('Transfer', {
        from,
        to,
        value: value.toString(),
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
      });
    });

    contract.on('DividendDistributed', async (token, amount, timestamp, event) => {
      await this.enqueueEvent('DividendDistributed', {
        token,
        amount: amount.toString(),
        timestamp: timestamp.toString(),
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
      });
    });

    contract.on('TokensMinted', async (to, amount, event) => {
      await this.enqueueEvent('TokensMinted', {
        to,
        amount: amount.toString(),
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
      });
    });

    contract.on('TokensBurned', async (from, amount, event) => {
      await this.enqueueEvent('TokensBurned', {
        from,
        amount: amount.toString(),
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
      });
    });

    this.logger.log('PermissionedToken listeners set up');
  }

  private async listenToVault() {
    const address = this.configService.get<string>('VAULT_ADDRESS');
    const abi = [
      'event Deposit(address indexed user, uint256 amount, uint256 shares)',
      'event Withdraw(address indexed user, uint256 amount, uint256 shares)',
      'event Harvest(uint256 profit, uint256 performanceFee)',
    ];

    const contract = new ethers.Contract(address, abi, this.provider);
    this.contracts.set('Vault', contract);

    contract.on('Deposit', async (user, amount, shares, event) => {
      await this.enqueueEvent('VaultDeposit', {
        user,
        amount: amount.toString(),
        shares: shares.toString(),
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
      });
    });

    contract.on('Withdraw', async (user, amount, shares, event) => {
      await this.enqueueEvent('VaultWithdraw', {
        user,
        amount: amount.toString(),
        shares: shares.toString(),
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
      });
    });

    contract.on('Harvest', async (profit, performanceFee, event) => {
      await this.enqueueEvent('VaultHarvest', {
        profit: profit.toString(),
        performanceFee: performanceFee.toString(),
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
      });
    });

    this.logger.log('Vault listeners set up');
  }

  private async listenToTrancheFactory() {
    const address = this.configService.get<string>('TRANCHE_FACTORY_ADDRESS');
    const abi = [
      'event TrancheCreated(uint256 indexed spvId, address[] trancheTokens, uint8[] priorities)',
      'event CashflowDistributed(uint256 indexed spvId, uint256 amount, uint256 timestamp)',
      'event TranchePayment(uint256 indexed spvId, address indexed trancheToken, uint256 amount)',
    ];

    const contract = new ethers.Contract(address, abi, this.provider);
    this.contracts.set('TrancheFactory', contract);

    contract.on('TrancheCreated', async (spvId, trancheTokens, priorities, event) => {
      await this.enqueueEvent('TrancheCreated', {
        spvId: spvId.toString(),
        trancheTokens,
        priorities,
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
      });
    });

    contract.on('CashflowDistributed', async (spvId, amount, timestamp, event) => {
      await this.enqueueEvent('CashflowDistributed', {
        spvId: spvId.toString(),
        amount: amount.toString(),
        timestamp: timestamp.toString(),
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
      });
    });

    contract.on('TranchePayment', async (spvId, trancheToken, amount, event) => {
      await this.enqueueEvent('TranchePayment', {
        spvId: spvId.toString(),
        trancheToken,
        amount: amount.toString(),
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
      });
    });

    this.logger.log('TrancheFactory listeners set up');
  }

  private async listenToSPVRegistry() {
    const address = this.configService.get<string>('SPV_REGISTRY_ADDRESS');
    const abi = [
      'event SPVRegistered(uint256 indexed spvId, address indexed owner, string name)',
      'event PropertyAdded(uint256 indexed spvId, uint256 indexed propertyId, string propertyAddress)',
    ];

    const contract = new ethers.Contract(address, abi, this.provider);
    this.contracts.set('SPVRegistry', contract);

    contract.on('SPVRegistered', async (spvId, owner, name, event) => {
      await this.enqueueEvent('SPVRegistered', {
        spvId: spvId.toString(),
        owner,
        name,
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
      });
    });

    contract.on('PropertyAdded', async (spvId, propertyId, propertyAddress, event) => {
      await this.enqueueEvent('PropertyAdded', {
        spvId: spvId.toString(),
        propertyId: propertyId.toString(),
        propertyAddress,
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
      });
    });

    this.logger.log('SPVRegistry listeners set up');
  }

  private async enqueueEvent(eventType: string, data: any) {
    try {
      await this.eventQueue.add(
        eventType,
        {
          eventType,
          data,
          timestamp: new Date(),
        },
        {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
      this.logger.log(`Event enqueued: ${eventType}`);
    } catch (error) {
      this.logger.error(`Failed to enqueue event: ${error.message}`);
    }
  }
}
