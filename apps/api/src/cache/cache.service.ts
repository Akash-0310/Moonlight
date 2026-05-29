import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { Key, TTL } from '../redis/redis.constants';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly redis: RedisService) {}

  // ─── Generic cache-aside with stale-while-revalidate ─────────────────────

  /**
   * Stale-while-revalidate: return stale data immediately while refreshing in background.
   * - Fresh (< TTL): return cached
   * - Stale (TTL < age < staleTTL): return cached + trigger background refresh
   * - Miss: fetch, cache, return
   */
  async swr<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number,
    staleTtlSeconds = ttlSeconds * 2,
  ): Promise<T> {
    const staleKey = `${key}:stale`;

    // Try fresh cache first
    const fresh = await this.redis.getJson<T>(key);
    if (fresh !== null) return fresh;

    // Try stale cache (return immediately + revalidate in background)
    const stale = await this.redis.getJson<T>(staleKey);
    if (stale !== null) {
      // Revalidate in background — don't await
      this.revalidate(key, staleKey, fetcher, ttlSeconds, staleTtlSeconds).catch(
        (e) => this.logger.warn(`SWR revalidation failed for ${key}: ${e.message}`),
      );
      return stale;
    }

    // Cache miss — fetch and store
    const data = await fetcher();
    await this.setWithStale(key, staleKey, data, ttlSeconds, staleTtlSeconds);
    return data;
  }

  private async revalidate<T>(
    key: string,
    staleKey: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number,
    staleTtlSeconds: number,
  ): Promise<void> {
    // Prevent thundering herd — only one revalidation at a time
    const lockKey = `${key}:lock`;
    const lockAcquired = await this.redis.acquireLock(lockKey, '1', 5000);
    if (!lockAcquired) return;

    try {
      const data = await fetcher();
      await this.setWithStale(key, staleKey, data, ttlSeconds, staleTtlSeconds);
    } finally {
      await this.redis.releaseLock(lockKey, '1');
    }
  }

  private async setWithStale<T>(
    key: string,
    staleKey: string,
    data: T,
    ttlSeconds: number,
    staleTtlSeconds: number,
  ): Promise<void> {
    const pipeline = this.redis.pipeline();
    const serialized = JSON.stringify(data);
    pipeline.set(key, serialized, 'EX', ttlSeconds);
    pipeline.set(staleKey, serialized, 'EX', staleTtlSeconds);
    await this.redis.execPipeline(pipeline);
  }

  // ─── Product-specific cache methods ──────────────────────────────────────

  async getProduct<T>(slug: string): Promise<T | null> {
    return this.redis.getJson<T>(Key.product.single(slug));
  }

  async setProduct<T>(slug: string, data: T): Promise<void> {
    await this.redis.setJson(Key.product.single(slug), data, TTL.PRODUCT_SINGLE);
  }

  async getProductList<T>(params: string): Promise<T | null> {
    return this.redis.getJson<T>(Key.product.list(params));
  }

  async setProductList<T>(params: string, data: T): Promise<void> {
    await this.redis.setJson(Key.product.list(params), data, TTL.PRODUCT_LIST);
  }

  async getHomepageData<T>(): Promise<T | null> {
    return this.redis.getJson<T>(Key.product.homepage());
  }

  async setHomepageData<T>(data: T): Promise<void> {
    await this.redis.setJson(Key.product.homepage(), data, TTL.PRODUCT_HOMEPAGE);
  }

  async getFeaturedProducts<T>(): Promise<T | null> {
    return this.redis.getJson<T>(Key.product.featured());
  }

  async setFeaturedProducts<T>(data: T): Promise<void> {
    await this.redis.setJson(Key.product.featured(), data, TTL.PRODUCT_FEATURED);
  }

  async getSearchResults<T>(queryHash: string): Promise<T | null> {
    return this.redis.getJson<T>(Key.product.search(queryHash));
  }

  async setSearchResults<T>(queryHash: string, data: T): Promise<void> {
    await this.redis.setJson(Key.product.search(queryHash), data, TTL.PRODUCT_SEARCH);
  }

  // ─── Cache invalidation ───────────────────────────────────────────────────

  /**
   * Invalidate a single product by slug (after update/delete).
   */
  async invalidateProduct(slug: string): Promise<void> {
    await this.redis.del(
      Key.product.single(slug),
      `${Key.product.single(slug)}:stale`,
    );
  }

  /**
   * Invalidate all product lists (after create/update/delete).
   * Also clears homepage and featured caches.
   */
  async invalidateProductLists(): Promise<void> {
    const deleted = await this.redis.delPattern(Key.product.invalidatePattern());
    this.logger.log(`Cache invalidated: ${deleted} product keys removed`);
  }

  /**
   * Full product cache bust — used after bulk operations.
   */
  async invalidateAll(): Promise<void> {
    await this.invalidateProductLists();
  }
}
