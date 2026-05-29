import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

  async getWishlist(userId: string) {
    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      include: { product: PRODUCT_INCLUDE },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((i) => ({
      productId: i.productId,
      addedAt: i.createdAt,
      product: i.product,
    }));
  }

  async addItem(userId: string, productId: string) {
    await this.prisma.wishlist.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });
    return this.getWishlist(userId);
  }

  async removeItem(userId: string, productId: string) {
    await this.prisma.wishlist.deleteMany({ where: { userId, productId } });
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
