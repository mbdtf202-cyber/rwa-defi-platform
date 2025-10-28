import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOrderDto, OrderType, OrderStatus } from './dto/create-order.dto';

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    // Verify user KYC status
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { kycVerification: true },
    });

    if (!user || user.kycVerification?.status !== 'APPROVED') {
      throw new BadRequestException('KYC verification required');
    }

    // Check token lockup period
    const holding = await this.prisma.tokenHolding.findFirst({
      where: {
        userId,
        tokenAddress: dto.tokenAddress,
      },
    });

    if (dto.type === OrderType.SELL) {
      if (!holding || holding.balance < dto.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // Check lockup
      if (holding.lockedUntil && new Date(holding.lockedUntil) > new Date()) {
        throw new BadRequestException('Tokens are locked');
      }
    }

    // Create order
    const order = await this.prisma.order.create({
      data: {
        userId,
        tokenAddress: dto.tokenAddress,
        type: dto.type,
        price: dto.price,
        amount: dto.amount,
        filledAmount: 0,
        status: OrderStatus.PENDING,
      },
    });

    // Try to match order
    await this.matchOrder(order.id);

    return order;
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('Not authorized');
    }

    if (order.status === OrderStatus.FILLED) {
      throw new BadRequestException('Order already filled');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  async getOrderBook(tokenAddress: string) {
    const buyOrders = await this.prisma.order.findMany({
      where: {
        tokenAddress,
        type: OrderType.BUY,
        status: { in: [OrderStatus.PENDING, OrderStatus.PARTIAL] },
      },
      orderBy: { price: 'desc' },
      take: 20,
    });

    const sellOrders = await this.prisma.order.findMany({
      where: {
        tokenAddress,
        type: OrderType.SELL,
        status: { in: [OrderStatus.PENDING, OrderStatus.PARTIAL] },
      },
      orderBy: { price: 'asc' },
      take: 20,
    });

    return {
      bids: buyOrders,
      asks: sellOrders,
    };
  }

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getTrades(tokenAddress: string, limit = 50) {
    return this.prisma.trade.findMany({
      where: { tokenAddress },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private async matchOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.status === OrderStatus.FILLED) {
      return;
    }

    // Find matching orders
    const matchingOrders = await this.prisma.order.findMany({
      where: {
        tokenAddress: order.tokenAddress,
        type: order.type === OrderType.BUY ? OrderType.SELL : OrderType.BUY,
        status: { in: [OrderStatus.PENDING, OrderStatus.PARTIAL] },
        ...(order.type === OrderType.BUY
          ? { price: { lte: order.price } }
          : { price: { gte: order.price } }),
      },
      orderBy: [
        { price: order.type === OrderType.BUY ? 'asc' : 'desc' },
        { createdAt: 'asc' },
      ],
    });

    for (const matchingOrder of matchingOrders) {
      const remainingAmount = order.amount - order.filledAmount;
      const matchingRemainingAmount =
        matchingOrder.amount - matchingOrder.filledAmount;

      if (remainingAmount <= 0) break;

      const tradeAmount = Math.min(remainingAmount, matchingRemainingAmount);
      const tradePrice = matchingOrder.price; // Price-time priority

      // Execute trade
      await this.executeTrade(order, matchingOrder, tradeAmount, tradePrice);
    }
  }

  private async executeTrade(
    order: any,
    matchingOrder: any,
    amount: number,
    price: number,
  ) {
    // Create trade record
    await this.prisma.trade.create({
      data: {
        tokenAddress: order.tokenAddress,
        buyOrderId: order.type === OrderType.BUY ? order.id : matchingOrder.id,
        sellOrderId:
          order.type === OrderType.SELL ? order.id : matchingOrder.id,
        buyerId: order.type === OrderType.BUY ? order.userId : matchingOrder.userId,
        sellerId:
          order.type === OrderType.SELL ? order.userId : matchingOrder.userId,
        amount,
        price,
      },
    });

    // Update orders
    const newOrderFilled = order.filledAmount + amount;
    const newMatchingFilled = matchingOrder.filledAmount + amount;

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        filledAmount: newOrderFilled,
        status:
          newOrderFilled >= order.amount
            ? OrderStatus.FILLED
            : OrderStatus.PARTIAL,
      },
    });

    await this.prisma.order.update({
      where: { id: matchingOrder.id },
      data: {
        filledAmount: newMatchingFilled,
        status:
          newMatchingFilled >= matchingOrder.amount
            ? OrderStatus.FILLED
            : OrderStatus.PARTIAL,
      },
    });

    // Update token holdings
    const buyer = order.type === OrderType.BUY ? order.userId : matchingOrder.userId;
    const seller =
      order.type === OrderType.SELL ? order.userId : matchingOrder.userId;

    await this.updateHoldings(buyer, seller, order.tokenAddress, amount);
  }

  private async updateHoldings(
    buyerId: string,
    sellerId: string,
    tokenAddress: string,
    amount: number,
  ) {
    // Decrease seller's balance
    await this.prisma.tokenHolding.updateMany({
      where: {
        userId: sellerId,
        tokenAddress,
      },
      data: {
        balance: { decrement: amount },
      },
    });

    // Increase buyer's balance
    const buyerHolding = await this.prisma.tokenHolding.findFirst({
      where: {
        userId: buyerId,
        tokenAddress,
      },
    });

    if (buyerHolding) {
      await this.prisma.tokenHolding.update({
        where: { id: buyerHolding.id },
        data: {
          balance: { increment: amount },
        },
      });
    } else {
      await this.prisma.tokenHolding.create({
        data: {
          userId: buyerId,
          tokenAddress,
          balance: amount,
        },
      });
    }
  }
}
