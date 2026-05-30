import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { QUEUE } from '../../../redis/redis.constants';
import { OrderJobData } from '../queue.service';
import { SentryService } from '../../../sentry/sentry.service';

@Injectable()
export class OrderProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderProcessor.name);
  private worker!: Worker;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly sentry: SentryService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      QUEUE.ORDER,
      async (job: Job<OrderJobData>) => this.process(job),
      {
        connection: (() => { const u = this.config.get<string>('redis.url') ?? ''; return u.startsWith('rediss://') ? { url: u, tls: { rejectUnauthorized: false } } : { url: u }; })(),
        concurrency: 3,
      },
    );

    this.worker.on('completed', (job) =>
      this.logger.log(`Order processed: ${job.data.orderId} — ${job.data.action}`),
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Order processing failed: ${job?.data?.orderId} — ${err.message}`);
      this.sentry.captureJobException(err, job?.name ?? 'process-order', QUEUE.ORDER, job?.id, job?.data, job?.attemptsMade);
    });
  }

  async onModuleDestroy() {
    await this.worker.close();
  }

  private async process(job: Job<OrderJobData>): Promise<void> {
    const { orderId, action } = job.data;
    this.logger.log(`Processing order ${orderId}: ${action}`);

    return Sentry.startSpan(
      {
        op: 'queue.process',
        name: `${QUEUE.ORDER}:${job.name}`,
        attributes: {
          'messaging.system': 'bullmq',
          'messaging.destination': QUEUE.ORDER,
          'messaging.message_id': job.id ?? '',
          'order.id': orderId,
          'order.action': action,
        },
      },
      async () => {
        switch (action) {
          case 'process':
            await this.prisma.order.update({
              where: { id: orderId },
              data: { status: 'processing' },
            });
            break;

          case 'confirm':
            await this.prisma.order.update({
              where: { id: orderId },
              data: { status: 'confirmed' },
            });
            break;

          case 'cancel':
            await this.prisma.order.update({
              where: { id: orderId },
              data: { status: 'cancelled' },
            });
            break;

          case 'refund':
            await this.prisma.order.update({
              where: { id: orderId },
              data: { status: 'refunded', paymentStatus: 'refunded' },
            });
            break;
        }
      },
    );
  }
}
