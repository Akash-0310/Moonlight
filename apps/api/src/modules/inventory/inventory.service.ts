import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Key, TTL } from '../../redis/redis.constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Lua script for atomic stock reservation.
 * Checks available stock and reserves atomically — prevents overselling.
 *
 * KEYS[1] = stock key (ml:inv:stock:{variantId})
 * KEYS[2] = reservation key (ml:inv:reserve:{reservationId})
 * ARGV[1] = requested quantity
 * ARGV[2] = reservation TTL in seconds
 * ARGV[3] = reservationId
 *
 * Returns:
 *   1  = success
 *   0  = insufficient stock
 *  -1  = stock key not found (load from DB first)
 */
const RESERVE_STOCK_SCRIPT = `
local stock_key = KEYS[1]
local reserve_key = KEYS[2]
local qty = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local reservation_id = ARGV[3]

local current = tonumber(redis.call('GET', stock_key))
if current == nil then
  return -1
end

if current < qty then
  return 0
end

-- Decrement stock atomically
redis.call('DECRBY', stock_key, qty)

-- Store reservation metadata
redis.call('SET', reserve_key, qty, 'EX', ttl)

return 1
`;

/**
 * Lua script for releasing a reservation (cancel or expire).
 * Returns reserved stock back to available.
 */
const RELEASE_RESERVATION_SCRIPT = `
local stock_key = KEYS[1]
local reserve_key = KEYS[2]

local reserved = tonumber(redis.call('GET', reserve_key))
if reserved == nil then
  return 0
end

redis.call('INCRBY', stock_key, reserved)
redis.call('DEL', reserve_key)
return reserved
`;

export interface StockReservation {
  reservationId: string;
  variantId: string;
  quantity: number;
  expiresAt: Date;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Sync DB stock into Redis (called on startup or cache miss) ───────────

  async syncVariantStock(variantId: string): Promise<number> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true },
    });

    if (!variant) throw new BadRequestException(`Variant ${variantId} not found`);

    const stockKey = Key.inventory.stock(variantId);
    await this.redis.set(stockKey, String(variant.stock));
    return variant.stock;
  }

  // ─── Get available stock (Redis-first, DB fallback) ───────────────────────

  async getAvailableStock(variantId: string): Promise<number> {
    const stockKey = Key.inventory.stock(variantId);
    const cached = await this.redis.get(stockKey);

    if (cached !== null) return parseInt(cached, 10);

    // Cache miss — load from DB
    return this.syncVariantStock(variantId);
  }

  // ─── Reserve stock atomically using Lua script ────────────────────────────

  async reserveStock(
    variantId: string,
    quantity: number,
    ttlSeconds = TTL.RESERVATION,
  ): Promise<StockReservation> {
    const reservationId = uuidv4();
    const stockKey = Key.inventory.stock(variantId);
    const reserveKey = Key.inventory.reservation(reservationId);

    // Ensure stock is in Redis
    const stockExists = await this.redis.exists(stockKey);
    if (!stockExists) {
      await this.syncVariantStock(variantId);
    }

    const result = await this.redis.eval(
      RESERVE_STOCK_SCRIPT,
      [stockKey, reserveKey],
      [String(quantity), String(ttlSeconds), reservationId],
    ) as number;

    if (result === -1) {
      // Stock key disappeared — reload and retry once
      await this.syncVariantStock(variantId);
      return this.reserveStock(variantId, quantity, ttlSeconds);
    }

    if (result === 0) {
      const available = await this.getAvailableStock(variantId);
      throw new BadRequestException(
        `Insufficient stock. Available: ${available}, Requested: ${quantity}`,
      );
    }

    this.logger.log(`Reserved ${quantity}x variant ${variantId} — reservation ${reservationId}`);

    return {
      reservationId,
      variantId,
      quantity,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    };
  }

  // ─── Release a reservation (cancel / timeout) ─────────────────────────────

  async releaseReservation(reservationId: string, variantId: string): Promise<number> {
    const stockKey = Key.inventory.stock(variantId);
    const reserveKey = Key.inventory.reservation(reservationId);

    const released = await this.redis.eval(
      RELEASE_RESERVATION_SCRIPT,
      [stockKey, reserveKey],
      [],
    ) as number;

    if (released > 0) {
      this.logger.log(`Released reservation ${reservationId}: +${released} stock for variant ${variantId}`);
    }

    return released;
  }

  // ─── Confirm reservation (deduct from DB permanently) ────────────────────

  async confirmReservation(reservationId: string, variantId: string, quantity: number): Promise<void> {
    // Deduct from DB (Redis already decremented during reservation)
    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: { decrement: quantity } },
    });

    // Clean up reservation key
    await this.redis.del(Key.inventory.reservation(reservationId));

    this.logger.log(`Confirmed reservation ${reservationId}: -${quantity} from DB variant ${variantId}`);
  }

  // ─── Bulk reserve for checkout (multiple variants) ────────────────────────

  async bulkReserve(
    items: Array<{ variantId: string; quantity: number }>,
    ttlSeconds = TTL.RESERVATION,
  ): Promise<StockReservation[]> {
    const reservations: StockReservation[] = [];
    const toRelease: Array<{ reservationId: string; variantId: string }> = [];

    for (const item of items) {
      try {
        const reservation = await this.reserveStock(item.variantId, item.quantity, ttlSeconds);
        reservations.push(reservation);
        toRelease.push({ reservationId: reservation.reservationId, variantId: item.variantId });
      } catch (err) {
        // Rollback all previous reservations in this batch
        for (const r of toRelease) {
          await this.releaseReservation(r.reservationId, r.variantId);
        }
        throw err;
      }
    }

    return reservations;
  }

  // ─── Distributed lock for critical inventory operations ───────────────────

  async withInventoryLock<T>(
    variantId: string,
    fn: () => Promise<T>,
    ttlMs = TTL.STOCK_LOCK * 1000,
  ): Promise<T> {
    const lockKey = Key.inventory.lock(variantId);
    const lockValue = uuidv4();

    const acquired = await this.redis.acquireLock(lockKey, lockValue, ttlMs);
    if (!acquired) {
      throw new BadRequestException('Could not acquire inventory lock. Please retry.');
    }

    try {
      return await fn();
    } finally {
      await this.redis.releaseLock(lockKey, lockValue);
    }
  }
}
