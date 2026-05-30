import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import { RedisService } from '../../../redis/redis.service';
import { Key, QUEUE } from '../../../redis/redis.constants';
import { AnalyticsJobData } from '../queue.service';
import { SentryService } from '../../../sentry/sentry.service';

@Injectable()
export class AnalyticsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsProcessor.name);
  private worker!: Worker;

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly sentry: SentryService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      QUEUE.ANALYTICS,
      async (job: Job<AnalyticsJobData>) => this.process(job),
      {
        connection: { url: this.config.get<string>('redis.url') },
        concurrency: 10,
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.warn(`Analytics job failed: ${err.message}`);
      this.sentry.captureJobException(err, job?.name ?? 'analytics', QUEUE.ANALYTICS, job?.id, job?.data, job?.attemptsMade);
    });
  }

  async onModuleDestroy() {
    await this.worker.close();
  }

  private async process(job: Job<AnalyticsJobData>): Promise<void> {
    const { event, productId, userId } = job.data;

    return Sentry.startSpan(
      {
        op: 'queue.process',
        name: `${QUEUE.ANALYTICS}:${event}`,
        attributes: {
          'messaging.system': 'bullmq',
          'messaging.destination': QUEUE.ANALYTICS,
          'analytics.event': event,
        },
      },
      async () => {
        switch (event) {
          case 'product_view':
            if (productId) {
              await this.redis.incr(Key.analytics.productViews(productId));
              await this.redis.zincrby(Key.analytics.trending(), 1, productId);
              if (userId) await this.redis.pfadd(Key.analytics.liveUsers(), userId);
            }
            break;

          case 'search': {
            const query = job.data.metadata?.query as string;
            if (query) {
              await this.redis.zincrby(Key.analytics.topSearches(), 1, query.toLowerCase());
            }
            break;
          }

          case 'order_placed': {
            const amount = job.data.metadata?.amount as number;
            if (amount) {
              const date = new Date().toISOString().split('T')[0];
              await this.redis.incrBy(Key.analytics.dailyRevenue(date), amount);
            }
            break;
          }
        }
      },
    );
  }
}
