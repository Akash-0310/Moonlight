import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
        : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');

    // In dev mode, Prisma emits query events — use them to detect slow queries
    if (process.env.NODE_ENV === 'development') {
      (this as any).$on('query', (e: { query: string; duration: number; params: string }) => {
        if (e.duration > 500) {
          Sentry.addBreadcrumb({
            category: 'db.slow_query',
            message: `Slow query: ${e.duration}ms`,
            level: 'warning',
            data: {
              query: e.query.substring(0, 300),
              duration_ms: e.duration,
            },
          });
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query.substring(0, 120)}`);
        }
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
