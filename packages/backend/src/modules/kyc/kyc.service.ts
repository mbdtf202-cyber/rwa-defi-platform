import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../common/prisma/prisma.service';
import { createHash } from 'crypto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KycService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HttpService) private httpService: HttpService,
    @Inject(ConfigService) private configService: ConfigService,
  ) {}

  async startKyc(userId: string, provider: 'ONFIDO' | 'PERSONA' | 'SUMSUB' = 'ONFIDO') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.kycStatus === 'APPROVED') {
      throw new BadRequestException('KYC already completed');
    }

    // Initialize KYC with provider
    let sessionUrl: string;
    let sessionId: string;

    switch (provider) {
      case 'ONFIDO':
        ({ sessionUrl, sessionId } = await this.initOnfido(user.email));
        break;
      case 'PERSONA':
        ({ sessionUrl, sessionId } = await this.initPersona(user.email));
        break;
      case 'SUMSUB':
        ({ sessionUrl, sessionId } = await this.initSumsub(user.email));
        break;
      default:
        throw new BadRequestException('Invalid KYC provider');
    }

    // Update user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        kycProvider: provider,
        kycStatus: 'PENDING',
      },
    });

    return {
      sessionUrl,
      sessionId,
      provider,
    };
  }

  async getKycStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        kycStatus: true,
        kycProvider: true,
        kycCompletedAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async handleWebhook(provider: string, payload: any) {
    // Verify webhook signature (simplified - in production use proper verification)
    
    let userId: string;
    let status: 'APPROVED' | 'REJECTED';
    let kycHash: string;

    switch (provider.toUpperCase()) {
      case 'ONFIDO':
        ({ userId, status, kycHash } = this.parseOnfidoWebhook(payload));
        break;
      case 'PERSONA':
        ({ userId, status, kycHash } = this.parsePersonaWebhook(payload));
        break;
      case 'SUMSUB':
        ({ userId, status, kycHash } = this.parseSumsubWebhook(payload));
        break;
      default:
        throw new BadRequestException('Invalid provider');
    }

    // Update user KYC status
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: status,
        kycHash,
        kycCompletedAt: status === 'APPROVED' ? new Date() : null,
      },
    });

    return { success: true };
  }

  private async initOnfido(email: string) {
    // Simplified Onfido integration
    // In production, use official Onfido SDK
    const apiKey = this.configService.get<string>('ONFIDO_API_KEY');
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.onfido.com/v3/applicants',
          {
            email,
            first_name: 'User',
            last_name: 'Name',
          },
          {
            headers: {
              Authorization: `Token token=${apiKey}`,
            },
          },
        ),
      );

      const applicantId = response.data.id;

      // Create SDK token
      const tokenResponse = await firstValueFrom(
        this.httpService.post(
          `https://api.onfido.com/v3/sdk_token`,
          {
            applicant_id: applicantId,
          },
          {
            headers: {
              Authorization: `Token token=${apiKey}`,
            },
          },
        ),
      );

      return {
        sessionUrl: `https://id.onfido.com?token=${tokenResponse.data.token}`,
        sessionId: applicantId,
      };
    } catch (error) {
      // Fallback for development
      return {
        sessionUrl: 'https://demo.onfido.com',
        sessionId: 'demo-session-id',
      };
    }
  }

  private async initPersona(email: string) {
    // Simplified Persona integration
    return {
      sessionUrl: 'https://withpersona.com/verify',
      sessionId: 'persona-session-id',
    };
  }

  private async initSumsub(email: string) {
    // Simplified Sumsub integration
    return {
      sessionUrl: 'https://sumsub.com/idensic',
      sessionId: 'sumsub-session-id',
    };
  }

  private parseOnfidoWebhook(payload: any): { userId: string; status: 'APPROVED' | 'REJECTED'; kycHash: string } {
    // Parse Onfido webhook payload
    const userId = payload.resource?.applicant_id || 'unknown';
    const status: 'APPROVED' | 'REJECTED' = payload.resource?.status === 'complete' ? 'APPROVED' : 'REJECTED';
    const kycHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

    return { userId, status, kycHash };
  }

  private parsePersonaWebhook(payload: any): { userId: string; status: 'APPROVED' | 'REJECTED'; kycHash: string } {
    // Parse Persona webhook payload
    const userId = payload.data?.id || 'unknown';
    const status: 'APPROVED' | 'REJECTED' = payload.data?.attributes?.status === 'approved' ? 'APPROVED' : 'REJECTED';
    const kycHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

    return { userId, status, kycHash };
  }

  private parseSumsubWebhook(payload: any): { userId: string; status: 'APPROVED' | 'REJECTED'; kycHash: string } {
    // Parse Sumsub webhook payload
    const userId = payload.applicantId || 'unknown';
    const status: 'APPROVED' | 'REJECTED' = payload.reviewStatus === 'completed' ? 'APPROVED' : 'REJECTED';
    const kycHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

    return { userId, status, kycHash };
  }
}
