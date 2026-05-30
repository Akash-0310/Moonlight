import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { EmailProcessor } from './processors/email.processor';
import { OrderProcessor } from './processors/order.processor';
import { AnalyticsProcessor } from './processors/analytics.processor';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [QueueService, EmailProcessor, OrderProcessor, AnalyticsProcessor],
  exports: [QueueService],
})
export class QueueModule {}
