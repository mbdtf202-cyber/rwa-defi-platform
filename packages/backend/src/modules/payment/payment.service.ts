import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TokenService } from '../token/token.service';
import Stripe from 'stripe';
import { CreatePaymentDto, ProcessCryptoDepositDto } from './dto';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16',
      });
    }
  }

  async createPaymentIntent(userId: string, dto: CreatePaymentDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.kycStatus !== 'APPROVED') {
      throw new BadRequestException('KYC not approved');
    }

    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(dto.amount * 100), // Convert to cents
        currency: dto.currency || 'usd',
        metadata: {
          userId,
          tokenAddress: dto.tokenAddress,
          type: 'token_purchase',
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: dto.amount,
        currency: dto.currency,
      };
    } catch (error) {
      throw new BadRequestException(`Payment creation failed: ${error.message}`);
    }
  }

  async handleStripeWebhook(signature: string, payload: any) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      throw new BadRequestException(`Webhook error: ${error.message}`);
    }
  }

  async processCryptoDeposit(dto: ProcessCryptoDepositDto) {
    // Verify transaction on blockchain
    // In production, use proper blockchain verification

    const user = await this.prisma.user.findUnique({
      where: { walletAddress: dto.fromAddress },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.kycStatus !== 'APPROVED') {
      throw new BadRequestException('KYC not approved');
    }

    // Record transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'DEPOSIT',
        tokenAddress: dto.tokenAddress,
        amount: dto.amount,
        fromAddress: dto.fromAddress,
        txHash: dto.txHash,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    // Mint tokens to user
    if (dto.shouldMint) {
      await this.tokenService.mintToken(
        {
          userId: user.id,
          tokenAddress: dto.mintTokenAddress || dto.tokenAddress,
          amount: dto.amount,
        },
        'system',
      );
    }

    return transaction;
  }

  async initiateWithdrawal(userId: string, amount: number, tokenAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.walletAddress) {
      throw new BadRequestException('User not found or wallet not linked');
    }

    // Check lockup period
    // In production, implement proper lockup checking

    // Burn tokens
    await this.tokenService.burnToken(
      {
        userId,
        tokenAddress,
        amount,
      },
      userId,
    );

    // Process withdrawal
    // In production, implement proper withdrawal processing

    return {
      success: true,
      amount,
      tokenAddress,
      status: 'PROCESSING',
    };
  }

  async getPaymentHistory(userId: string, limit = 50, offset = 0) {
    // Get all deposit/withdrawal transactions
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: { in: ['DEPOSIT', 'WITHDRAW'] },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.transaction.count({
      where: {
        userId,
        type: { in: ['DEPOSIT', 'WITHDRAW'] },
      },
    });

    return {
      transactions,
      total,
      limit,
      offset,
    };
  }

  private async handlePaymentSuccess(paymentIntent: any) {
    const { userId, tokenAddress } = paymentIntent.metadata;
    const amount = paymentIntent.amount / 100; // Convert from cents

    // Mint tokens to user
    await this.tokenService.mintToken(
      {
        userId,
        tokenAddress,
        amount,
      },
      'system',
    );

    console.log(`Payment successful for user ${userId}, minted ${amount} tokens`);
  }

  private async handlePaymentFailure(paymentIntent: any) {
    const { userId } = paymentIntent.metadata;
    console.log(`Payment failed for user ${userId}`);
    
    // In production, notify user and handle failure
  }
}
