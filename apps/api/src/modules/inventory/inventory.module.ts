import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
