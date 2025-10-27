import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // API prefix
  app.setGlobalPrefix('api/v1');
  
  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  // Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    setupSwagger(app);
    logger.log('📚 Swagger documentation available at /api');
  }
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`🚀 Server running on http://localhost:${port}`);
  logger.log(`📚 API docs: http://localhost:${port}/api`);
  logger.log(`❤️  Health check: http://localhost:${port}/health`);
}

bootstrap();
