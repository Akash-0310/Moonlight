// Sentry MUST be initialized before any other imports so it can patch modules
import './sentry/instrument';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('port', 4000);
  const allowedOrigins = config.get<string[]>('allowedOrigins', ['http://localhost:3000']);
  const isProduction = config.get<string>('nodeEnv') === 'production';

  // Security headers — prevents clickjacking, MIME sniffing, XSS, etc.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow Cloudinary images
    }),
  );

  // Parse cookies for refresh token
  app.use(cookieParser());

  // CORS — only allow listed origins, credentials (cookies) enabled
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  // Strict validation — strip unknown fields, transform types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip fields not in DTO
      forbidNonWhitelisted: true, // Throw on unknown fields
      transform: true,           // Auto-transform (e.g., string → number)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`API running on http://localhost:${port}/api`);
  logger.log(`Environment: ${isProduction ? 'production' : 'development'}`);
}

bootstrap();
