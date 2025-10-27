import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    requestBody?: any;
    responseStatus: number;
  }) {
    const auditLog = await this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        requestBody: data.requestBody,
        responseStatus: data.responseStatus,
      },
    });

    return auditLog;
  }

  async getLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.resource) where.resource = filters.resource;
    
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        take: filters.limit || 50,
        skip: filters.offset || 0,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              userType: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  }

  async exportLogs(filters: {
    startDate: Date;
    endDate: Date;
    format?: 'CSV' | 'JSON';
  }) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            userType: true,
          },
        },
      },
    });

    if (filters.format === 'CSV') {
      return this.convertToCSV(logs);
    }

    return logs;
  }

  async getStatistics(startDate: Date, endDate: Date) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate statistics
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const resourceCounts = logs.reduce((acc, log) => {
      acc[log.resource] = (acc[log.resource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusCounts = logs.reduce((acc, log) => {
      const statusGroup = Math.floor(log.responseStatus / 100) * 100;
      acc[statusGroup] = (acc[statusGroup] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalLogs: logs.length,
      actionCounts,
      resourceCounts,
      statusCounts,
      period: {
        start: startDate,
        end: endDate,
      },
    };
  }

  private convertToCSV(logs: any[]): string {
    if (logs.length === 0) return '';

    const headers = ['Timestamp', 'User Email', 'Action', 'Resource', 'Status', 'IP Address'];
    const rows = logs.map((log) => [
      log.timestamp.toISOString(),
      log.user?.email || 'N/A',
      log.action,
      log.resource,
      log.responseStatus,
      log.ipAddress || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csvContent;
  }
}
