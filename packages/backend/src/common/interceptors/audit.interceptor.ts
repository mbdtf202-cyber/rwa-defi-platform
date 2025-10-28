import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: async (response) => {
          const duration = Date.now() - startTime;
          
          // Log successful operations
          await this.prisma.auditLog.create({
            data: {
              userId: user?.id,
              action: `${method} ${url}`,
              resource: this.extractResource(url),
              details: {
                method,
                url,
                body: this.sanitizeBody(body),
                statusCode: 200,
                duration,
              },
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
              timestamp: new Date(),
            },
          }).catch(err => console.error('Audit log failed:', err));
        },
        error: async (error) => {
          const duration = Date.now() - startTime;
          
          // Log failed operations
          await this.prisma.auditLog.create({
            data: {
              userId: user?.id,
              action: `${method} ${url}`,
              resource: this.extractResource(url),
              details: {
                method,
                url,
                body: this.sanitizeBody(body),
                statusCode: error.status || 500,
                error: error.message,
                duration,
              },
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
              timestamp: new Date(),
            },
          }).catch(err => console.error('Audit log failed:', err));
        },
      }),
    );
  }

  private extractResource(url: string): string {
    const parts = url.split('/');
    return parts[3] || 'unknown'; // Assuming /api/v1/resource format
  }

  private sanitizeBody(body: any): any {
    if (!body) return {};
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }
}
