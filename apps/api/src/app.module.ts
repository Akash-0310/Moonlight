import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { CartModule } from './modules/cart/cart.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { QueueModule } from './modules/queue/queue.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { AiCacheModule } from './modules/ai-cache/ai-cache.module';
import { CacheModule } from './cache/cache.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    // Global config — available everywhere via ConfigService
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting — 100 requests per minute per IP globally
    // Auth endpoints override this with tighter limits via @Throttle()
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60_000, // 1 minute
        limit: 100,
      },
    ]),

    PrismaModule,
    RedisModule,
    CacheModule,
    RateLimitModule,
    AuthModule,
    CartModule,
    ProductsModule,
    OrdersModule,
    WishlistModule,
    InventoryModule,
    QueueModule,
    AnalyticsModule,
    RealtimeModule,
    AiCacheModule,
  ],
  providers: [
    // Global exception filter — all unhandled errors go here
    { provide: APP_FILTER, useClass: HttpExceptionFilter },

    // Global response envelope: { success: true, data: ..., timestamp: ... }
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },

    // JWT guard applied globally — use @Public() to opt out
    { provide: APP_GUARD, useClass: JwtAuthGuard },

    // Role guard checks @Roles() decorator after JWT guard passes
    { provide: APP_GUARD, useClass: RolesGuard },

    // Rate limiter guard
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
