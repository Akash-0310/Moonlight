import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { QUEUE } from '../../../redis/redis.constants';
import { OrderJobData } from '../queue.service';

@Injectable()
export class OrderProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderProcessor.name);
  private worker!: Worker;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      QUEUE.ORDER,
      async (job: Job<OrderJobData>) => this.process(job),
      {
        connection: { url: this.config.get<string>('redis.url') },
        concurrency: 3,
      },
    );

    this.worker.on('completed', (job) =>
      this.logger.log(`Order processed: ${job.data.orderId} — ${job.data.action}`),
    );

    this.worker.on('failed', (job, err) =>
      this.logger.error(`Order processing failed: ${job?.data?.orderId} — ${err.message}`),
    );
  }

  async onModuleDestroy() {
    await this.worker.close();
  }

  private async process(job: Job<OrderJobData>): Promise<void> {
    const { orderId, action } = job.data;
    this.logger.log(`Processing order ${orderId}: ${action}`);

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
  }
}
