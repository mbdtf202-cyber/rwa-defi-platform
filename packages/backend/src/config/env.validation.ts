import { plainToInstance } from 'class-transformer';
import { IsString, IsNumber, IsEnum, validateSync, IsOptional } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRATION: string = '1d';

  @IsString()
  @IsOptional()
  REFRESH_TOKEN_EXPIRATION: string = '7d';

  @IsString()
  @IsOptional()
  ETHEREUM_RPC_URL: string;

  @IsString()
  @IsOptional()
  PRIVATE_KEY: string;

  @IsString()
  @IsOptional()
  ONFIDO_API_KEY: string;

  @IsString()
  @IsOptional()
  PERSONA_API_KEY: string;

  @IsString()
  @IsOptional()
  SUMSUB_API_KEY: string;

  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY: string;

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET: string;

  @IsString()
  @IsOptional()
  ML_SERVICE_URL: string = 'http://localhost:8000';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
