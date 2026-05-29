import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

const CART_ITEM_INCLUDE = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: {
        select: {
          id: true,
          url: true,
          isPrimary: true,
        },
        orderBy: { isPrimary: 'desc' as const },
        take: 1,
      },
    },
  },
  variant: {
    select: {
      id: true,
      size: true,
      stock: true,
    },
  },
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          include: CART_ITEM_INCLUDE,
          orderBy: { id: 'asc' },
        },
      },
    });

    return this.formatCart(cart);
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const { productId, variantId, quantity = 1 } = dto;

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    if (variant.productId !== productId) {
      throw new BadRequestException('Variant does not belong to the specified product');
    }

    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true },
    });

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId,
        },
      },
    });

    const newQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    if (variant.stock < newQuantity) {
      throw new BadRequestException(
        `Insufficient stock. Only ${variant.stock} unit(s) available.`,
      );
    }

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId,
          quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, dto: UpdateCartDto) {
    const { cartItemId, quantity } = dto;

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: cartItemId } });
    } else {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId },
        select: { stock: true },
      });

      if (!variant) {
        throw new NotFoundException('Product variant not found');
      }

      if (variant.stock < quantity) {
        throw new BadRequestException(
          `Insufficient stock. Only ${variant.stock} unit(s) available.`,
        );
      }

      await this.prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
      });
    }

    return this.getCart(userId);
  }

  async removeItem(userId: string, cartItemId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({ where: { id: cartItemId } });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return this.getCart(userId);
  }

  private formatCart(cart: any) {
    const subtotal = cart.items.reduce(
      (sum: number, item: any) =>
        sum + Number(item.product.price) * item.quantity,
      0,
    );

    return {
      id: cart.id,
      userId: cart.userId,
      itemCount: cart.items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0,
      ),
      subtotal,
      items: cart.items.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: Number(item.product.price),
        totalPrice: Number(item.product.price) * item.quantity,
        product: item.product,
        variant: item.variant,
      })),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}
