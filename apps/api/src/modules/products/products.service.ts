import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { createHash } from 'crypto';

// Full include — used for product detail page (includes description, all images, all variants)
const PRODUCT_INCLUDE = {
  images: {
    orderBy: { sortOrder: 'asc' as const },
  },
  variants: {
    orderBy: { size: 'asc' as const },
  },
} satisfies Prisma.ProductInclude;

// Lightweight include — used for listing pages (no description, only primary image)
const PRODUCT_LIST_INCLUDE = {
  images: {
    where: { isPrimary: true },
    take: 1,
    orderBy: { sortOrder: 'asc' as const },
  },
  variants: {
    select: { id: true, size: true, stock: true },
    orderBy: { size: 'asc' as const },
  },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly analytics: AnalyticsService,
  ) {}

  // ─── Public Queries ─────────────────────────────────────────────────────────

  async findAll(query: ProductQueryDto) {
    const cacheKey = createHash('md5').update(JSON.stringify(query)).digest('hex');
    const cached = await this.cache.getProductList(cacheKey);
    if (cached) return cached;

    const {
      category,
      subCategory,
      search,
      sort,
      page = 1,
      limit = 12,
      bestseller,
    } = query;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(category?.length && { category: { in: category } }),
      ...(subCategory?.length && { subCategory: { in: subCategory } }),
      ...(bestseller !== undefined && { isBestseller: bestseller }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy = this.buildOrderBy(sort);
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_LIST_INCLUDE,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const result = { items, total, page, totalPages: Math.ceil(total / limit) };
    await this.cache.setProductList(cacheKey, result);
    return result;
  }

  async findBySlug(slug: string, userId?: string) {
    const cached = await this.cache.getProduct(slug);
    if (cached) {
      if (userId) void this.analytics.trackProductView((cached as { id: string }).id, userId);
      return cached;
    }

    const product = await this.prisma.product.findUnique({
      where: { slug, isActive: true },
      include: PRODUCT_INCLUDE,
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    await this.cache.setProduct(slug, product);
    if (userId) void this.analytics.trackProductView(product.id, userId);
    return product;
  }

  async findBestsellers() {
    const cached = await this.cache.getFeaturedProducts();
    if (cached) return cached;

    const products = await this.prisma.product.findMany({
      where: { isActive: true, isBestseller: true },
      include: PRODUCT_LIST_INCLUDE,
      orderBy: { avgRating: 'desc' },
      take: 8,
    });

    await this.cache.setFeaturedProducts(products);
    return products;
  }

  async findLatest() {
    const cached = await this.cache.getHomepageData<unknown[]>();
    if (cached) return cached;

    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: PRODUCT_LIST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    await this.cache.setHomepageData(products);
    return products;
  }

  async getCategories() {
    type NavData = Record<string, { total: number; subCategories: Record<string, number> }>;

    const cached = await this.cache.getNavCategories<NavData>();
    if (cached) return cached;

    const counts = await this.prisma.product.groupBy({
      by: ['category', 'subCategory'],
      where: { isActive: true },
      _count: { _all: true },
    });

    const nav: NavData = {};
    for (const row of counts) {
      if (!nav[row.category]) nav[row.category] = { total: 0, subCategories: {} };
      nav[row.category].total += row._count._all;
      nav[row.category].subCategories[row.subCategory] = row._count._all;
    }

    await this.cache.setNavCategories(nav);
    return nav;
  }

  // ─── Admin Mutations ────────────────────────────────────────────────────────

  async create(dto: CreateProductDto) {
    const slug = await this.generateUniqueSlug(dto.name);

    try {
      return await this.prisma.product.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description,
          price: dto.price,
          category: dto.category,
          subCategory: dto.subCategory,
          isBestseller: dto.isBestseller ?? false,
          images: {
            create: dto.images.map((img, index) => ({
              url: img.url,
              cloudinaryId: img.cloudinaryId,
              isPrimary: img.isPrimary ?? index === 0,
              sortOrder: img.sortOrder ?? index,
            })),
          },
          variants: {
            create: dto.variants.map((v) => ({
              size: v.size,
              stock: v.stock,
            })),
          },
        },
        include: PRODUCT_INCLUDE,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A product with this slug already exists');
      }
      throw new InternalServerErrorException('Failed to create product');
    } finally {
      void this.cache.invalidateProductLists();
      void this.cache.invalidateNavCategories();
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findByIdOrThrow(id);

    const data: Prisma.ProductUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
      // Regenerate slug when name changes
      data.slug = await this.generateUniqueSlug(dto.name, id);
    }
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.subCategory !== undefined) data.subCategory = dto.subCategory;
    if (dto.isBestseller !== undefined) data.isBestseller = dto.isBestseller;

    // Replace images if provided
    if (dto.images !== undefined) {
      data.images = {
        deleteMany: {},
        create: dto.images.map((img, index) => ({
          url: img.url,
          cloudinaryId: img.cloudinaryId,
          isPrimary: img.isPrimary ?? index === 0,
          sortOrder: img.sortOrder ?? index,
        })),
      };
    }

    // Replace variants if provided
    if (dto.variants !== undefined) {
      data.variants = {
        deleteMany: {},
        create: dto.variants.map((v) => ({
          size: v.size,
          stock: v.stock,
        })),
      };
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data,
      include: PRODUCT_INCLUDE,
    });

    await this.cache.invalidateProduct(updated.slug);
    void this.cache.invalidateProductLists();
    void this.cache.invalidateNavCategories();
    return updated;
  }

  async remove(id: string) {
    const product = await this.findByIdOrThrow(id);

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await this.cache.invalidateProduct((product as { slug: string }).slug);
    void this.cache.invalidateProductLists();
    void this.cache.invalidateNavCategories();

    return { message: 'Product deactivated successfully' };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async findByIdOrThrow(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }
    return product;
  }

  private generateSlugBase(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private randomSuffix(): string {
    return Math.random().toString(36).substring(2, 6);
  }

  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = this.generateSlugBase(name);
    const suffix = this.randomSuffix();
    const candidate = `${base}-${suffix}`;

    const existing = await this.prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    // If no conflict, or the conflict is the product we're updating, use it
    if (!existing || (excludeId && existing.id === excludeId)) {
      return candidate;
    }

    // Retry with a new suffix (rare collision)
    return this.generateUniqueSlug(name, excludeId);
  }

  private buildOrderBy(
    sort?: string,
  ): Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] {
    switch (sort) {
      case 'price_asc':
        return { price: 'asc' };
      case 'price_desc':
        return { price: 'desc' };
      case 'rating':
        return { avgRating: 'desc' };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }
}
