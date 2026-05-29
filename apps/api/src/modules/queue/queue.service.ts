import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { QUEUE } from '../../redis/redis.constants';

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

export interface OrderJobData {
  orderId: string;
  userId: string;
  action: 'process' | 'confirm' | 'cancel' | 'refund';
}

export interface InvoiceJobData {
  orderId: string;
  userId: string;
  email: string;
}

export interface AnalyticsJobData {
  event: string;
  userId?: string;
  productId?: string;
  metadata?: Record<string, unknown>;
}

export interface CartReminderJobData {
  userId: string;
  email: string;
  cartSnapshot: unknown[];
}

export interface WebhookJobData {
  url: string;
  payload: unknown;
  event: string;
  attemptCount?: number;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private queues = new Map<string, Queue>();
  private workers = new Map<string, Worker>();
  private events = new Map<string, QueueEvents>();

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const connection = { url: this.config.get<string>('redis.url') };
    const defaultOpts = {
      connection,
      defaultJobOptions: {
        removeOnComplete: { count: 100 },  // keep last 100 completed jobs
        removeOnFail: { count: 500 },       // keep last 500 failed jobs
        attempts: 3,
        backoff: { type: 'exponential' as const, delay: 2000 },
      },
    };

    // Initialize all queues
    for (const queueName of Object.values(QUEUE)) {
      const q = new Queue(queueName, defaultOpts);
      this.queues.set(queueName, q);
      this.logger.log(`Queue initialized: ${queueName}`);
    }
  }

  async onModuleDestroy() {
    for (const queue of this.queues.values()) await queue.close();
    for (const worker of this.workers.values()) await worker.close();
    for (const events of this.events.values()) await events.close();
  }

  getQueue(name: string): Queue {
    const q = this.queues.get(name);
    if (!q) throw new Error(`Queue "${name}" not found`);
    return q;
  }

  // ─── Email jobs ────────────────────────────────────────────────────────────

  async sendEmail(data: EmailJobData, opts?: { delay?: number }): Promise<Job> {
    return this.getQueue(QUEUE.EMAIL).add('send-email', data, {
      delay: opts?.delay,
      priority: 1,
    });
  }

  async sendOrderConfirmationEmail(orderId: string, email: string): Promise<Job> {
    return this.sendEmail({
      to: email,
      subject: 'Order Confirmed — MoonLight',
      template: 'order-confirmation',
      context: { orderId },
    });
  }

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<Job> {
    return this.sendEmail({
      to: email,
      subject: 'Reset Your MoonLight Password',
      template: 'password-reset',
      context: { resetUrl },
    });
  }

  // ─── Order jobs ────────────────────────────────────────────────────────────

  async processOrder(data: OrderJobData): Promise<Job> {
    return this.getQueue(QUEUE.ORDER).add('process-order', data, { priority: 1 });
  }

  // ─── Invoice jobs ──────────────────────────────────────────────────────────

  async generateInvoice(data: InvoiceJobData): Promise<Job> {
    return this.getQueue(QUEUE.INVOICE).add('generate-invoice', data, {
      delay: 2000, // slight delay after order confirmation
    });
  }

  // ─── Analytics jobs ───────────────────────────────────────────────────────

  async trackEvent(data: AnalyticsJobData): Promise<Job> {
    return this.getQueue(QUEUE.ANALYTICS).add('track-event', data, {
      priority: 10, // low priority
      removeOnComplete: true,
    });
  }

  // ─── Cart reminder (abandoned cart) ───────────────────────────────────────

  async scheduleCartReminder(data: CartReminderJobData, delayMs = 3_600_000): Promise<Job> {
    // Default: remind after 1 hour of cart inactivity
    return this.getQueue(QUEUE.CART_REMINDER).add('cart-reminder', data, {
      delay: delayMs,
      jobId: `cart-reminder:${data.userId}`, // deduplication — only one per user
    });
  }

  async cancelCartReminder(userId: string): Promise<void> {
    const queue = this.getQueue(QUEUE.CART_REMINDER);
    const job = await queue.getJob(`cart-reminder:${userId}`);
    if (job) {
      await job.remove();
      this.logger.log(`Cart reminder cancelled for user ${userId}`);
    }
  }

  // ─── Webhook retry ────────────────────────────────────────────────────────

  async sendWebhook(data: WebhookJobData): Promise<Job> {
    return this.getQueue(QUEUE.WEBHOOK).add('send-webhook', data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  // ─── Queue health ─────────────────────────────────────────────────────────

  async getQueueStats(): Promise<Record<string, { waiting: number; active: number; failed: number; completed: number }>> {
    const stats: Record<string, { waiting: number; active: number; failed: number; completed: number }> = {};

    for (const [name, queue] of this.queues) {
      const [waiting, active, failed, completed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getFailedCount(),
        queue.getCompletedCount(),
      ]);
      stats[name] = { waiting, active, failed, completed };
    }

    return stats;
  }

  // ─── Dead letter queue — move failed jobs for inspection ─────────────────

  async moveToDLQ(job: Job, queueName: string): Promise<void> {
    const dlqQueue = this.getQueue(QUEUE.NOTIFICATION);
    await dlqQueue.add('dlq-item', {
      originalQueue: queueName,
      jobId: job.id,
      jobName: job.name,
      data: job.data,
      failReason: job.failedReason,
      failedAt: new Date().toISOString(),
    });
  }
}
