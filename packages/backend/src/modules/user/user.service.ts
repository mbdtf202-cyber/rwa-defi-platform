import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateProfileDto, LinkWalletDto } from './dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        walletAddress: true,
        kycStatus: true,
        kycProvider: true,
        kycCompletedAt: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        walletAddress: true,
        kycStatus: true,
        userType: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async linkWallet(userId: string, dto: LinkWalletDto) {
    // Verify wallet signature (simplified - in production use proper signature verification)
    if (!dto.walletAddress || !dto.signature) {
      throw new Error('Invalid wallet data');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        walletAddress: dto.walletAddress,
      },
      select: {
        id: true,
        email: true,
        walletAddress: true,
      },
    });

    return user;
  }

  async getTransactions(userId: string, limit = 50, offset = 0) {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.transaction.count({
      where: { userId },
    });

    return {
      transactions,
      total,
      limit,
      offset,
    };
  }

  async getHoldings(userId: string) {
    // Get all transactions for the user
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        status: 'CONFIRMED',
        type: { in: ['MINT', 'BURN', 'TRANSFER'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate holdings by token
    const holdings = new Map<string, { balance: number; tokenAddress: string }>();

    for (const tx of transactions) {
      const current = holdings.get(tx.tokenAddress) || { balance: 0, tokenAddress: tx.tokenAddress };
      
      if (tx.type === 'MINT' || (tx.type === 'TRANSFER' && tx.toAddress === tx.userId)) {
        current.balance += Number(tx.amount);
      } else if (tx.type === 'BURN' || (tx.type === 'TRANSFER' && tx.fromAddress === tx.userId)) {
        current.balance -= Number(tx.amount);
      }
      
      holdings.set(tx.tokenAddress, current);
    }

    return Array.from(holdings.values()).filter(h => h.balance > 0);
  }
}
