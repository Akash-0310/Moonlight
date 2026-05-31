import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private keepAliveInterval?: ReturnType<typeof setInterval>;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
        : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    // Retry connect — Neon's compute may be suspended on cold start and need
    // a few seconds to wake up. Don't block the full NestJS bootstrap; retry
    // in the background so the app can bind its port and serve other routes.
    this.connectWithRetry();

    // Neon free tier suspends after 5 min of inactivity, dropping the TCP connection.
    // A keepalive ping every 4 min prevents the "Error { kind: Closed }" on the next query.
    if (process.env.NODE_ENV === 'production') {
      this.keepAliveInterval = setInterval(async () => {
        try {
          await this.$queryRaw`SELECT 1`;
        } catch {
          this.logger.warn('DB keepalive failed, reconnecting…');
          await this.$disconnect().catch(() => null);
          await this.$connect().catch((e) => this.logger.error('DB reconnect failed', e));
        }
      }, 4 * 60 * 1000); // every 4 minutes
    }

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

  private async connectWithRetry(attempts = 5, delayMs = 3000): Promise<void> {
    for (let i = 1; i <= attempts; i++) {
      try {
        await this.$connect();
        this.logger.log('Database connected');
        return;
      } catch (err) {
        this.logger.warn(`DB connect attempt ${i}/${attempts} failed: ${(err as Error).message}`);
        if (i < attempts) await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    this.logger.error('Database failed to connect after all retries — queries will fail until the connection is restored');
  }

  async onModuleDestroy() {
    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    await this.$disconnect();
  }
}
