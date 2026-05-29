import { Module } from '@nestjs/common';
import { AiCacheService } from './ai-cache.service';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [AiCacheService],
  exports: [AiCacheService],
})
export class AiCacheModule {}
