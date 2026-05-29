import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { Key, TTL } from '../../redis/redis.constants';

export interface TrendingProduct {
  productId: string;
  score: number;
}

export interface AnalyticsSummary {
  liveUsers: number;
  trending: TrendingProduct[];
  topSearches: Array<{ query: string; count: number }>;
  productViews: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly redis: RedisService) {}

  // ─── Product view tracking ────────────────────────────────────────────────

  async trackProductView(productId: string, userId?: string): Promise<void> {
    const pipeline = this.redis.pipeline();

    // Increment total views for this product
    pipeline.incr(Key.analytics.productViews(productId));

    // Increment trending score (sorted set)
    pipeline.zincrby(Key.analytics.trending(), 1, productId);

    // Track unique viewers with HyperLogLog (approximate unique count, very memory efficient)
    if (userId) {
      pipeline.pfadd(Key.analytics.liveUsers(), userId);
      pipeline.expire(Key.analytics.liveUsers(), TTL.LIVE_USERS);
    }

    await this.redis.execPipeline(pipeline);
  }

  // ─── Search tracking ──────────────────────────────────────────────────────

  async trackSearch(query: string, userId?: string): Promise<void> {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery || normalizedQuery.length < 2) return;

    await this.redis.zincrby(Key.analytics.topSearches(), 1, normalizedQuery);

    if (userId) {
      await this.redis.pfadd(Key.analytics.liveUsers(), userId);
    }
  }

  // ─── Get trending products (top 20 by views in window) ───────────────────

  async getTrending(limit = 20): Promise<TrendingProduct[]> {
    const results = await this.redis.zrevrange(Key.analytics.trending(), 0, limit - 1, true);

    const trending: TrendingProduct[] = [];
    for (let i = 0; i < results.length; i += 2) {
      trending.push({
        productId: results[i],
        score: parseFloat(results[i + 1]),
      });
    }
    return trending;
  }

  // ─── Decay trending scores (run periodically — cronjob) ───────────────────

  async decayTrendingScores(factor = 0.9): Promise<void> {
    // Reduce all scores by factor to decay old trends
    const members = await this.redis.zrevrange(Key.analytics.trending(), 0, -1, true);

    if (!members.length) return;

    const pipeline = this.redis.pipeline();
    for (let i = 0; i < members.length; i += 2) {
      const member = members[i];
      const score = parseFloat(members[i + 1]) * factor;
      pipeline.zadd(Key.analytics.trending(), score, member);
    }

    // Remove entries with very low scores
    pipeline.zremrangebyscore(Key.analytics.trending(), '-inf', 0.1);
    await this.redis.execPipeline(pipeline);
  }

  // ─── Top searches ─────────────────────────────────────────────────────────

  async getTopSearches(limit = 10): Promise<Array<{ query: string; count: number }>> {
    const results = await this.redis.zrevrange(Key.analytics.topSearches(), 0, limit - 1, true);

    const searches: Array<{ query: string; count: number }> = [];
    for (let i = 0; i < results.length; i += 2) {
      searches.push({
        query: results[i],
        count: parseFloat(results[i + 1]),
      });
    }
    return searches;
  }

  // ─── Live user count (approximate, via HyperLogLog) ──────────────────────

  async getLiveUserCount(): Promise<number> {
    return this.redis.pfcount(Key.analytics.liveUsers());
  }

  // ─── Product view count ───────────────────────────────────────────────────

  async getProductViewCount(productId: string): Promise<number> {
    const val = await this.redis.get(Key.analytics.productViews(productId));
    return val ? parseInt(val, 10) : 0;
  }

  // ─── Revenue tracking ─────────────────────────────────────────────────────

  async trackRevenue(amount: number, date?: string): Promise<void> {
    const dateKey = date ?? new Date().toISOString().split('T')[0];
    await this.redis.incrBy(Key.analytics.dailyRevenue(dateKey), Math.round(amount));
  }

  async getDailyRevenue(date?: string): Promise<number> {
    const dateKey = date ?? new Date().toISOString().split('T')[0];
    const val = await this.redis.get(Key.analytics.dailyRevenue(dateKey));
    return val ? parseInt(val, 10) : 0;
  }

  // ─── Dashboard summary ────────────────────────────────────────────────────

  async getDashboardSummary(): Promise<AnalyticsSummary> {
    const [liveUsers, trending, topSearches] = await Promise.all([
      this.getLiveUserCount(),
      this.getTrending(10),
      this.getTopSearches(10),
    ]);

    return { liveUsers, trending, topSearches, productViews: 0 };
  }
}
