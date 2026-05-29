import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PlaceOrderDto } from './dto/place-order.dto';
import { UpdateOrderStatusDto } from './dto/update-status.dto';

const DELIVERY_FEE = 10;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ─── Place Order ────────────────────────────────────────────────────────────

  async placeOrder(userId: string, dto: PlaceOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // 1. Look up variants and products (server-side price check — never trust client prices)
    const variantIds = dto.items.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    });

    if (variants.length !== variantIds.length) {
      throw new BadRequestException('One or more product variants not found');
    }

    // Check stock availability
    for (const item of dto.items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) throw new BadRequestException(`Variant ${item.variantId} not found`);
      if (!variant.product.isActive) {
        throw new BadRequestException(`Product "${variant.product.name}" is no longer available`);
      }
      if (variant.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${variant.product.name}" (size: ${variant.size}). Available: ${variant.stock}`,
        );
      }
    }

    // 2. Create or find address
    const addressData = dto.address;
    const address = await this.prisma.address.create({
      data: {
        userId,
        firstName: addressData.firstName,
        lastName: addressData.lastName,
        street: addressData.street,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode,
        country: addressData.country || 'India',
        phone: addressData.phone,
        isDefault: false,
      },
    });

    // 3. Resolve coupon if provided
    let discount = 0;
    let couponId: string | undefined;

    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findFirst({
        where: {
          code: dto.couponCode,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      if (!coupon) {
        throw new BadRequestException('Invalid or expired coupon code');
      }

      if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
        throw new BadRequestException('Coupon usage limit has been reached');
      }

      couponId = coupon.id;

      // Calculate subtotal first to check minOrderValue
      const rawSubtotal = dto.items.reduce((sum, item) => {
        const variant = variants.find((v) => v.id === item.variantId)!;
        return sum + Number(variant.product.price) * item.quantity;
      }, 0);

      if (Number(coupon.minOrderValue) > 0 && rawSubtotal < Number(coupon.minOrderValue)) {
        throw new BadRequestException(
          `Minimum order value for this coupon is ₹${coupon.minOrderValue}`,
        );
      }

      if (coupon.type === 'percentage') {
        discount = (rawSubtotal * Number(coupon.value)) / 100;
      } else {
        discount = Math.min(Number(coupon.value), rawSubtotal);
      }
    }

    // 4. Calculate subtotal from real DB prices
    const subtotal = dto.items.reduce((sum, item) => {
      const variant = variants.find((v) => v.id === item.variantId)!;
      return sum + Number(variant.product.price) * item.quantity;
    }, 0);

    const deliveryFee = DELIVERY_FEE;
    const total = subtotal + deliveryFee - discount;

    // 5. Create Order + OrderItems in a transaction, decrement stock, clear cart, increment coupon uses
    const order = await this.prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId,
          addressId: address.id,
          paymentMethod: dto.paymentMethod,
          status: OrderStatus.pending,
          paymentStatus: PaymentStatus.pending,
          subtotal,
          deliveryFee,
          discount,
          total,
          couponId: couponId ?? null,
          notes: dto.notes ?? null,
          items: {
            create: dto.items.map((item) => {
              const variant = variants.find((v) => v.id === item.variantId)!;
              const primaryImage = variant.product.images[0];
              return {
                productId: variant.productId,
                variantId: variant.id,
                productName: variant.product.name,
                productImage: primaryImage?.url ?? '',
                priceAtPurchase: Number(variant.product.price),
                size: variant.size,
                quantity: item.quantity,
              };
            }),
          },
        },
        include: { items: true },
      });

      // Decrement stock for each variant
      for (const item of dto.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Increment coupon usage if applied
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { currentUses: { increment: 1 } },
        });
      }

      // Clear user's cart
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return newOrder;
    });

    // 6. Handle payment method
    if (dto.paymentMethod === PaymentMethod.cod) {
      // COD: immediately confirm
      const confirmed = await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.confirmed },
        include: { items: true, address: true },
      });
      return { order: confirmed };
    }

    if (dto.paymentMethod === PaymentMethod.stripe) {
      return this.initiateStripePayment(order.id, total, userId);
    }

    if (dto.paymentMethod === PaymentMethod.razorpay) {
      return this.initiateRazorpayPayment(order.id, total);
    }

    return { order };
  }

  // ─── Get My Orders ──────────────────────────────────────────────────────────

  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Admin: Get All Orders ──────────────────────────────────────────────────

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: true,
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Admin: Update Order Status ─────────────────────────────────────────────

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
      include: { items: true, address: true },
    });
  }

  // ─── Verify Stripe Payment ──────────────────────────────────────────────────

  async verifyStripe(userId: string, sessionId: string) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new BadRequestException('Stripe is not configured on this server');
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe');
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Stripe payment has not been completed');
    }

    const order = await this.prisma.order.findFirst({
      where: { stripeSessionId: sessionId, userId },
    });

    if (!order) throw new NotFoundException('Order not found for this session');

    if (order.paymentStatus === PaymentStatus.paid) {
      return { message: 'Payment already verified', order };
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.paid,
        status: OrderStatus.confirmed,
        stripePaymentId: session.payment_intent as string,
      },
      include: { items: true, address: true },
    });

    return { message: 'Payment verified successfully', order: updated };
  }

  // ─── Verify Razorpay Payment ────────────────────────────────────────────────

  async verifyRazorpay(
    userId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string,
  ) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new BadRequestException('Razorpay is not configured on this server');
    }

    // Verify HMAC signature
    const crypto = require('crypto') as typeof import('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new BadRequestException('Razorpay payment signature verification failed');
    }

    const order = await this.prisma.order.findFirst({
      where: { razorpayOrderId, userId },
    });

    if (!order) throw new NotFoundException('Order not found for this Razorpay order');

    if (order.paymentStatus === PaymentStatus.paid) {
      return { message: 'Payment already verified', order };
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.paid,
        status: OrderStatus.confirmed,
        razorpayPaymentId,
      },
      include: { items: true, address: true },
    });

    return { message: 'Payment verified successfully', order: updated };
  }

  // ─── Private: Initiate Stripe ────────────────────────────────────────────────

  private async initiateStripePayment(orderId: string, total: number, userId: string) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const clientUrl = this.config.get<string>('clientUrl') || 'http://localhost:3000';

    if (!stripeKey) {
      this.logger.warn('STRIPE_SECRET_KEY not set — returning mock checkout URL');
      await this.prisma.order.update({
        where: { id: orderId },
        data: { stripeSessionId: `mock_session_${orderId}` },
      });
      return {
        orderId,
        checkoutUrl: `${clientUrl}/orders/${orderId}/mock-payment?provider=stripe`,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe');
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Fetch order items for line items
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: order.items.map((item) => ({
        price_data: {
          currency: 'inr',
          product_data: {
            name: item.productName,
            images: item.productImage ? [item.productImage] : [],
          },
          unit_amount: Math.round(Number(item.priceAtPurchase) * 100),
        },
        quantity: item.quantity,
      })),
      success_url: `${clientUrl}/orders/${orderId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/orders/${orderId}/cancel`,
      metadata: { orderId, userId },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { stripeSessionId: session.id },
    });

    return { orderId, checkoutUrl: session.url as string };
  }

  // ─── Private: Initiate Razorpay ──────────────────────────────────────────────

  private async initiateRazorpayPayment(orderId: string, total: number) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const clientUrl = this.config.get<string>('clientUrl') || 'http://localhost:3000';

    if (!keyId || !keySecret) {
      this.logger.warn('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — returning mock');
      const mockRazorpayOrderId = `mock_rp_order_${orderId}`;
      await this.prisma.order.update({
        where: { id: orderId },
        data: { razorpayOrderId: mockRazorpayOrderId },
      });
      return {
        orderId,
        razorpayOrderId: mockRazorpayOrderId,
        amount: Math.round(total * 100),
        currency: 'INR',
        keyId: 'mock_key',
        mock: true,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const rpOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // paise
      currency: 'INR',
      receipt: orderId,
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { razorpayOrderId: rpOrder.id as string },
    });

    return {
      orderId,
      razorpayOrderId: rpOrder.id as string,
      amount: rpOrder.amount as number,
      currency: rpOrder.currency as string,
      keyId,
    };
  }
}
