import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { RedisService } from '../../redis/redis.service';
import { Key, TTL } from '../../redis/redis.constants';

@Injectable()
export class AiCacheService {
  private readonly logger = new Logger(AiCacheService.name);

  constructor(private readonly redis: RedisService) {}

  // ─── Hash a prompt for use as cache key ───────────────────────────────────

  private hashPrompt(prompt: string): string {
    return createHash('sha256').update(prompt.toLowerCase().trim()).digest('hex').slice(0, 16);
  }

  // ─── AI response cache ────────────────────────────────────────────────────

  async getCachedResponse<T>(prompt: string): Promise<T | null> {
    const key = Key.ai.response(this.hashPrompt(prompt));
    return this.redis.getJson<T>(key);
  }

  async setCachedResponse<T>(prompt: string, response: T): Promise<void> {
    const key = Key.ai.response(this.hashPrompt(prompt));
    await this.redis.setJson(key, response, TTL.AI_RESPONSE);
    this.logger.debug(`AI response cached: ${key}`);
  }

  /**
   * Cache-aside for AI calls. Fetches from Redis first, calls AI on miss.
   */
  async withCache<T>(prompt: string, aiCall: () => Promise<T>): Promise<T> {
    const cached = await this.getCachedResponse<T>(prompt);
    if (cached !== null) {
      this.logger.debug(`AI cache hit: ${this.hashPrompt(prompt)}`);
      return cached;
    }

    this.logger.debug(`AI cache miss — calling AI`);
    const result = await aiCall();
    await this.setCachedResponse(prompt, result);
    return result;
  }

  // ─── Product recommendations ──────────────────────────────────────────────

  async getRecommendations(userId: string): Promise<string[] | null> {
    return this.redis.getJson<string[]>(Key.ai.recommendation(userId));
  }

  async setRecommendations(userId: string, productIds: string[]): Promise<void> {
    await this.redis.setJson(Key.ai.recommendation(userId), productIds, TTL.RECOMMENDATION);
  }

  async invalidateRecommendations(userId: string): Promise<void> {
    await this.redis.del(Key.ai.recommendation(userId));
  }

  // ─── Product embeddings (for semantic search) ─────────────────────────────

  async getEmbedding(productId: string): Promise<number[] | null> {
    return this.redis.getJson<number[]>(Key.ai.embedding(productId));
  }

  async setEmbedding(productId: string, embedding: number[]): Promise<void> {
    await this.redis.setJson(Key.ai.embedding(productId), embedding, TTL.EMBEDDING);
  }

  // ─── Similar products cache ───────────────────────────────────────────────

  async getSimilarProducts(productId: string): Promise<string[] | null> {
    return this.redis.getJson<string[]>(Key.ai.similarProducts(productId));
  }

  async setSimilarProducts(productId: string, similarIds: string[]): Promise<void> {
    await this.redis.setJson(Key.ai.similarProducts(productId), similarIds, TTL.RECOMMENDATION);
  }

  // ─── Cache statistics ─────────────────────────────────────────────────────

  async getCacheStats(): Promise<{ totalKeys: number }> {
    const client = this.redis.getClient();
    const keys = await client.keys('ml:ai:*');
    return { totalKeys: keys.length };
  }
}
