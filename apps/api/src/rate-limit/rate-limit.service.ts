import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { Key, RATE_LIMIT } from '../redis/redis.constants';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(private readonly redis: RedisService) {}

  // ─── Generic sliding window check ────────────────────────────────────────

  async check(
    key: string,
    max: number,
    windowSec: number,
  ): Promise<RateLimitResult> {
    const result = await this.redis.slidingWindowRateLimit(key, max, windowSec);
    return {
      ...result,
      retryAfter: result.allowed ? undefined : windowSec,
    };
  }

  // ─── Auth rate limits ─────────────────────────────────────────────────────

  async checkLogin(identifier: string): Promise<RateLimitResult> {
    const key = Key.rateLimit.auth(`login:${identifier}`);
    return this.check(key, RATE_LIMIT.AUTH_LOGIN.max, RATE_LIMIT.AUTH_LOGIN.windowSec);
  }

  async checkRegister(ip: string): Promise<RateLimitResult> {
    const key = Key.rateLimit.auth(`register:${ip}`);
    return this.check(key, RATE_LIMIT.AUTH_REGISTER.max, RATE_LIMIT.AUTH_REGISTER.windowSec);
  }

  async checkForgotPassword(identifier: string): Promise<RateLimitResult> {
    const key = Key.rateLimit.password(identifier);
    return this.check(key, RATE_LIMIT.FORGOT_PASSWORD.max, RATE_LIMIT.FORGOT_PASSWORD.windowSec);
  }

  // ─── Checkout protection ──────────────────────────────────────────────────

  async checkCheckout(userId: string): Promise<RateLimitResult> {
    const key = Key.rateLimit.checkout(userId);
    return this.check(key, RATE_LIMIT.CHECKOUT.max, RATE_LIMIT.CHECKOUT.windowSec);
  }

  // ─── API rate limit ───────────────────────────────────────────────────────

  async checkApi(identifier: string): Promise<RateLimitResult> {
    const key = Key.rateLimit.api(identifier);
    return this.check(key, RATE_LIMIT.API_DEFAULT.max, RATE_LIMIT.API_DEFAULT.windowSec);
  }

  // ─── Combined IP + user sliding window ───────────────────────────────────

  async checkCombined(
    ip: string,
    userId: string | undefined,
    type: keyof typeof RATE_LIMIT,
  ): Promise<RateLimitResult> {
    const { max, windowSec } = RATE_LIMIT[type];

    // Check IP limit
    const ipKey = Key.rateLimit.api(`ip:${ip}`);
    const ipResult = await this.check(ipKey, max, windowSec);
    if (!ipResult.allowed) return ipResult;

    // Check user-specific limit (stricter)
    if (userId) {
      const userKey = Key.rateLimit.api(`user:${userId}`);
      return this.check(userKey, Math.floor(max * 1.5), windowSec);
    }

    return ipResult;
  }
}
