import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { QUEUE } from '../../../redis/redis.constants';
import { EmailJobData } from '../queue.service';

@Injectable()
export class EmailProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailProcessor.name);
  private worker!: Worker;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.worker = new Worker(
      QUEUE.EMAIL,
      async (job: Job<EmailJobData>) => this.process(job),
      {
        connection: { url: this.config.get<string>('redis.url') },
        concurrency: 5,
      },
    );

    this.worker.on('completed', (job) =>
      this.logger.log(`Email sent: ${job.data.to} — ${job.data.subject}`),
    );

    this.worker.on('failed', (job, err) =>
      this.logger.error(`Email failed: ${job?.data?.to} — ${err.message}`),
    );
  }

  async onModuleDestroy() {
    await this.worker.close();
  }

  private async process(job: Job<EmailJobData>): Promise<void> {
    const { to, subject, template, context } = job.data;
    this.logger.log(`Processing email job ${job.id}: ${template} → ${to}`);

    // In production: integrate with Resend / Nodemailer / SendGrid
    // const nodemailer = require('nodemailer');
    // await transporter.sendMail({ to, subject, html: renderTemplate(template, context) });

    // Development: log email content
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`[EMAIL DEV] To: ${to} | Subject: ${subject} | Template: ${template}`);
      this.logger.debug(`Context: ${JSON.stringify(context)}`);
      return;
    }

    // Production email sending would go here
    throw new Error('Configure email provider (Resend/Nodemailer) in production');
  }
}
