import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Key, TTL } from '../../redis/redis.constants';

const PRODUCT_INCLUDE = {
  select: {
    id: true,
    name: true,
    slug: true,
    price: true,
    category: true,
    subCategory: true,
    isBestseller: true,
    images: {
      select: { url: true, isPrimary: true },
      orderBy: { isPrimary: 'desc' as const },
      take: 1,
    },
  },
};

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getWishlist(userId: string) {
    const cacheKey = Key.wishlist.user(userId);
    const cached = await this.redis.getJson<any>(cacheKey);
    if (cached) return cached;

    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      include: { product: PRODUCT_INCLUDE },
      orderBy: { createdAt: 'desc' },
    });
    const formatted = items.map((i) => ({
      productId: i.productId,
      addedAt: i.createdAt,
      product: i.product,
    }));

    await this.redis.setJson(cacheKey, formatted, TTL.WISHLIST_USER);
    return formatted;
  }

  async addItem(userId: string, productId: string) {
    await this.prisma.wishlist.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });
    await this.redis.del(Key.wishlist.user(userId));
    return this.getWishlist(userId);
  }

  async removeItem(userId: string, productId: string) {
    await this.prisma.wishlist.deleteMany({ where: { userId, productId } });
    await this.redis.del(Key.wishlist.user(userId));
    return this.getWishlist(userId);
  }

  async toggleItem(userId: string, productId: string) {
    const exists = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (exists) return this.removeItem(userId, productId);
    return this.addItem(userId, productId);
  }
}
