import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const PRODUCT_INCLUDE = {
  images: {
    orderBy: { sortOrder: 'asc' as const },
  },
  variants: {
    orderBy: { size: 'asc' as const },
  },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Public Queries ─────────────────────────────────────────────────────────

  async findAll(query: ProductQueryDto) {
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
      ...(category && { category }),
      ...(subCategory && { subCategory }),
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
        include: PRODUCT_INCLUDE,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug, isActive: true },
      include: PRODUCT_INCLUDE,
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    return product;
  }

  async findBestsellers() {
    return this.prisma.product.findMany({
      where: { isActive: true, isBestseller: true },
      include: PRODUCT_INCLUDE,
      orderBy: { avgRating: 'desc' },
      take: 8,
    });
  }

  async findLatest() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
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

    return this.prisma.product.update({
      where: { id },
      data,
      include: PRODUCT_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findByIdOrThrow(id);

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

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
