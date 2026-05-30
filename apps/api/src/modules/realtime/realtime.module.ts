import { Module } from '@nestjs/common';
import { RealtimeService } from './realtime.service';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
