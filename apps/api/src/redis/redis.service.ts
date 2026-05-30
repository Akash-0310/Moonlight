import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { ChainableCommander } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  private subscriber!: Redis; // dedicated connection for pub/sub

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('redis.url') as string;
    const tls = url.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined;
    const opts = {
      lazyConnect: true,
      retryStrategy: (times: number) => Math.min(times * 100, 3000),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      ...(tls && { tls }),
    };

    this.client = new Redis(url, opts);
    this.subscriber = new Redis(url, { ...opts, lazyConnect: true });

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err) => this.logger.error('Redis error', err));
    this.subscriber.on('error', (err) => this.logger.error('Redis subscriber error', err));
  }

  async onModuleDestroy() {
    await this.client.quit();
    await this.subscriber.quit();
  }

  // ─── Expose raw client (for BullMQ, etc.) ───────────────────────────────────

  getClient(): Redis { return this.client; }

  // ─── String ops ─────────────────────────────────────────────────────────────

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(...keys: string[]): Promise<number> {
    if (!keys.length) return 0;
    return this.client.del(...keys);
  }

  async exists(...keys: string[]): Promise<boolean> {
    const result = await this.client.exists(...keys);
    return result > 0;
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async incrBy(key: string, amount: number): Promise<number> {
    return this.client.incrby(key, amount);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  // ─── JSON helpers ────────────────────────────────────────────────────────────

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  }

  // ─── Backward compat aliases ──────────────────────────────────────────────

  async cacheJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.setJson(key, value, ttlSeconds);
  }

  async getCachedJson<T>(key: string): Promise<T | null> {
    return this.getJson<T>(key);
  }

  // ─── Hash ops ────────────────────────────────────────────────────────────────

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hmset(key: string, data: Record<string, string>): Promise<void> {
    await this.client.hmset(key, data);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    return this.client.hdel(key, ...fields);
  }

  async hkeys(key: string): Promise<string[]> {
    return this.client.hkeys(key);
  }

  async hincrby(key: string, field: string, amount: number): Promise<number> {
    return this.client.hincrby(key, field, amount);
  }

  // ─── Set ops ─────────────────────────────────────────────────────────────────

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.client.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    return (await this.client.sismember(key, member)) === 1;
  }

  async scard(key: string): Promise<number> {
    return this.client.scard(key);
  }

  // ─── Sorted set ops ──────────────────────────────────────────────────────────

  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.client.zadd(key, score, member);
  }

  async zincrby(key: string, increment: number, member: string): Promise<number> {
    return parseFloat(await this.client.zincrby(key, increment, member));
  }

  async zrevrange(key: string, start: number, stop: number, withScores?: boolean): Promise<string[]> {
    if (withScores) return this.client.zrevrange(key, start, stop, 'WITHSCORES');
    return this.client.zrevrange(key, start, stop);
  }

  async zrangebyscore(key: string, min: number | string, max: number | string): Promise<string[]> {
    return this.client.zrangebyscore(key, min, max);
  }

  async zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number> {
    return this.client.zremrangebyscore(key, min, max);
  }

  async zcard(key: string): Promise<number> {
    return this.client.zcard(key);
  }

  async zscore(key: string, member: string): Promise<number | null> {
    const s = await this.client.zscore(key, member);
    return s !== null ? parseFloat(s) : null;
  }

  // ─── HyperLogLog (for unique visitor counting) ────────────────────────────

  async pfadd(key: string, ...elements: string[]): Promise<number> {
    return this.client.pfadd(key, ...elements);
  }

  async pfcount(...keys: string[]): Promise<number> {
    return this.client.pfcount(...keys);
  }

  // ─── List ops ─────────────────────────────────────────────────────────────

  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.client.lpush(key, ...values);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.client.rpush(key, ...values);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    await this.client.ltrim(key, start, stop);
  }

  async llen(key: string): Promise<number> {
    return this.client.llen(key);
  }

  // ─── Pattern delete (use sparingly in production) ─────────────────────────

  async delPattern(pattern: string): Promise<number> {
    const keys = await this.client.keys(pattern);
    if (!keys.length) return 0;
    // Delete in batches to avoid blocking
    const batchSize = 100;
    let deleted = 0;
    for (let i = 0; i < keys.length; i += batchSize) {
      deleted += await this.del(...keys.slice(i, i + batchSize));
    }
    return deleted;
  }

  // ─── Pipeline (batch multiple commands) ──────────────────────────────────

  pipeline(): ChainableCommander {
    return this.client.pipeline();
  }

  async execPipeline(pipeline: ChainableCommander): Promise<Array<[Error | null, unknown]>> {
    const results = await pipeline.exec();
    return results ?? [];
  }

  // ─── Lua scripting ────────────────────────────────────────────────────────

  async eval(script: string, keys: string[], args: string[]): Promise<unknown> {
    return this.client.eval(script, keys.length, ...keys, ...args);
  }

  // ─── Distributed lock (SET NX PX) ────────────────────────────────────────

  async acquireLock(lockKey: string, lockValue: string, ttlMs: number): Promise<boolean> {
    const result = await this.client.set(lockKey, lockValue, 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    // Lua script ensures we only delete OUR lock (atomic check-and-delete)
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await this.eval(script, [lockKey], [lockValue]);
    return result === 1;
  }

  // ─── Session management helpers ──────────────────────────────────────────

  async setRefreshToken(jti: string, userId: string, ttlSeconds: number): Promise<void> {
    await this.set(`ml:auth:refresh:${jti}`, userId, ttlSeconds);
  }

  async getRefreshToken(jti: string): Promise<string | null> {
    return this.get(`ml:auth:refresh:${jti}`);
  }

  async deleteRefreshToken(jti: string): Promise<void> {
    await this.del(`ml:auth:refresh:${jti}`);
  }

  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    await this.set(`ml:auth:blacklist:${jti}`, '1', ttlSeconds);
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    return this.exists(`ml:auth:blacklist:${jti}`);
  }

  // ─── Pub / Sub ────────────────────────────────────────────────────────────

  async publish(channel: string, message: string): Promise<number> {
    return this.client.publish(channel, message);
  }

  async publishJson<T>(channel: string, data: T): Promise<void> {
    await this.publish(channel, JSON.stringify(data));
  }

  async subscribe(channel: string, handler: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) handler(msg);
    });
  }

  async psubscribe(pattern: string, handler: (channel: string, message: string) => void): Promise<void> {
    await this.subscriber.psubscribe(pattern);
    this.subscriber.on('pmessage', (_pattern, ch, msg) => handler(ch, msg));
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }

  // ─── Sliding window rate limit ───────────────────────────────────────────

  /**
   * Sliding window rate limiter using sorted sets.
   * Returns { allowed, remaining, resetAt }
   */
  async slidingWindowRateLimit(
    key: string,
    max: number,
    windowSec: number,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const windowStart = now - windowSec * 1000;
    const resetAt = Math.floor(now / 1000) + windowSec;

    const script = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local window_start = tonumber(ARGV[2])
      local max = tonumber(ARGV[3])
      local window_sec = tonumber(ARGV[4])

      -- Remove expired entries
      redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

      -- Count current entries
      local count = redis.call('ZCARD', key)

      if count < max then
        -- Add current request
        redis.call('ZADD', key, now, now .. '-' .. math.random(1, 1000000))
        redis.call('EXPIRE', key, window_sec)
        return {1, max - count - 1}
      else
        return {0, 0}
      end
    `;

    const result = await this.eval(script, [key], [
      String(now),
      String(windowStart),
      String(max),
      String(windowSec),
    ]) as [number, number];

    return {
      allowed: result[0] === 1,
      remaining: result[1],
      resetAt,
    };
  }
}
