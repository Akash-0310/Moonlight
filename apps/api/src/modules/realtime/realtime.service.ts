import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { Key } from '../../redis/redis.constants';

export interface OrderStatusUpdate {
  orderId: string;
  status: string;
  updatedAt: string;
  message?: string;
}

export interface InventoryUpdate {
  variantId: string;
  productId: string;
  availableStock: number;
  action: 'reserved' | 'released' | 'confirmed' | 'restocked';
}

export interface AdminNotification {
  type: 'new_order' | 'low_stock' | 'new_user' | 'payment_failed';
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(private readonly redis: RedisService) {}

  // ─── Order status updates ─────────────────────────────────────────────────

  async publishOrderUpdate(update: OrderStatusUpdate): Promise<void> {
    await this.redis.publishJson(Key.channel.orderStatus(update.orderId), update);
    this.logger.log(`Order ${update.orderId} status → ${update.status}`);
  }

  async subscribeToOrderUpdates(
    orderId: string,
    handler: (update: OrderStatusUpdate) => void,
  ): Promise<void> {
    await this.redis.subscribe(Key.channel.orderStatus(orderId), (msg) => {
      try {
        handler(JSON.parse(msg) as OrderStatusUpdate);
      } catch {
        this.logger.warn(`Invalid order update message: ${msg}`);
      }
    });
  }

  // ─── Inventory updates ────────────────────────────────────────────────────

  async publishInventoryUpdate(update: InventoryUpdate): Promise<void> {
    await this.redis.publishJson(Key.channel.inventory(update.variantId), update);

    // Also publish to a global inventory channel for dashboard
    await this.redis.publishJson('ml:channel:inventory:all', update);
  }

  async subscribeToInventoryUpdates(
    variantId: string,
    handler: (update: InventoryUpdate) => void,
  ): Promise<void> {
    await this.redis.subscribe(Key.channel.inventory(variantId), (msg) => {
      try {
        handler(JSON.parse(msg) as InventoryUpdate);
      } catch {
        this.logger.warn(`Invalid inventory update message: ${msg}`);
      }
    });
  }

  // ─── Admin notifications ──────────────────────────────────────────────────

  async notifyAdmin(notification: Omit<AdminNotification, 'timestamp'>): Promise<void> {
    const payload: AdminNotification = {
      ...notification,
      timestamp: new Date().toISOString(),
    };
    await this.redis.publishJson(Key.channel.adminNotify(), payload);
    this.logger.log(`Admin notified: ${notification.type} — ${notification.message}`);
  }

  async notifyNewOrder(orderId: string, total: number): Promise<void> {
    await this.notifyAdmin({
      type: 'new_order',
      message: `New order placed: ₹${total.toLocaleString('en-IN')}`,
      data: { orderId, total },
    });
  }

  async notifyLowStock(productName: string, variantId: string, stock: number): Promise<void> {
    await this.notifyAdmin({
      type: 'low_stock',
      message: `Low stock alert: ${productName} (${stock} remaining)`,
      data: { variantId, stock },
    });
  }

  async subscribeToAdminNotifications(
    handler: (notification: AdminNotification) => void,
  ): Promise<void> {
    await this.redis.subscribe(Key.channel.adminNotify(), (msg) => {
      try {
        handler(JSON.parse(msg) as AdminNotification);
      } catch {
        this.logger.warn(`Invalid admin notification: ${msg}`);
      }
    });
  }

  // ─── Price change notifications ───────────────────────────────────────────

  async publishPriceChange(productId: string, newPrice: number, oldPrice: number): Promise<void> {
    await this.redis.publishJson(Key.channel.priceChange(productId), {
      productId,
      newPrice,
      oldPrice,
      changePercent: (((newPrice - oldPrice) / oldPrice) * 100).toFixed(1),
      updatedAt: new Date().toISOString(),
    });
  }
}
