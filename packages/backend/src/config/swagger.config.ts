import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('RWA DeFi Platform API')
    .setDescription('API documentation for Real World Asset DeFi Platform')
    .setVersion('1.0.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('kyc', 'KYC verification')
    .addTag('spv', 'SPV management')
    .addTag('tokens', 'Token operations')
    .addTag('payments', 'Payment processing')
    .addTag('oracle', 'Oracle data')
    .addTag('audit', 'Audit logs')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3000', 'Local development')
    .addServer('https://api-staging.rwa-defi.com', 'Staging')
    .addServer('https://api.rwa-defi.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'RWA DeFi API Docs',
  });
}
