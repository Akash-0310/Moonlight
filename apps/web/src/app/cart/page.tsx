'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, X, Minus, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth.store';
import { useCartStore } from '@/lib/store/cart.store';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CartSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border border-[#f0f0f0]">
          <div className="w-20 h-20 bg-[#f0f0f0] shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 bg-[#f0f0f0] rounded w-3/4" />
            <div className="h-3 bg-[#f0f0f0] rounded w-1/3" />
            <div className="h-3 bg-[#f0f0f0] rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { items, isLoading, fetchCart, updateItem, removeItem } = useCartStore();
  const [promoCode, setPromoCode] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/cart');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch cart on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#c9a96e]" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // ── Derived values ──────────────────────────────────────────────────────────
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * parseFloat(item.product.price),
    0,
  );
  const deliveryFee = subtotal > 999 ? 0 : 10;
  const total = subtotal + deliveryFee;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleRemove = async (cartItemId: string) => {
    setRemovingId(cartItemId);
    try {
      await removeItem(cartItemId);
      toast.success('Item removed from cart');
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setRemovingId(null);
    }
  };

  const handleQuantityChange = async (cartItemId: string, newQty: number) => {
    if (newQty < 1) {
      await handleRemove(cartItemId);
      return;
    }
    setUpdatingId(cartItemId);
    try {
      await updateItem(cartItemId, newQty);
    } catch {
      toast.error('Failed to update quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Empty State ──────────────────────────────────────────────────────────────

  if (!isLoading && items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-6 text-center">
        <ShoppingBag size={56} strokeWidth={1} className="text-[#ccc]" />
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#111] mb-2">
            Your cart is empty
          </h2>
          <p className="text-[#888] text-sm tracking-wide">
            Looks like you haven&apos;t added anything yet.
          </p>
        </div>
        <Link
          href="/shop"
          className="bg-[#111] text-white text-xs font-bold tracking-[0.2em] uppercase px-8 py-4 hover:bg-[#333] transition-colors duration-200 inline-flex items-center gap-2"
        >
          Continue Shopping <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  // ── Cart Layout ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="border-b border-[#f0f0f0] px-6 md:px-12 lg:px-16 py-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#c9a96e] text-[10px] font-bold tracking-[0.4em] uppercase mb-1">
            MoonLight
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111]">
            YOUR CART
          </h1>
          {items.length > 0 && (
            <p className="text-[#888] text-sm mt-1">
              {items.reduce((s, i) => s + i.quantity, 0)} item
              {items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-start">

          {/* ── LEFT: Cart Items ──────────────────────────────────────────── */}
          <div>
            {isLoading ? (
              <CartSkeleton />
            ) : (
              <div className="divide-y divide-[#f0f0f0]">
                {items.map((item) => {
                  const primaryImage =
                    item.product.images.find((img) => img.isPrimary)?.url ??
                    item.product.images[0]?.url ??
                    '';
                  const itemTotal = item.quantity * parseFloat(item.product.price);
                  const isRemoving = removingId === item.id;
                  const isUpdating = updatingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`flex gap-5 py-6 transition-opacity duration-200 ${
                        isRemoving ? 'opacity-40 pointer-events-none' : ''
                      }`}
                    >
                      {/* Product Image */}
                      <div className="relative w-20 h-20 shrink-0 bg-[#f5f5f5] overflow-hidden">
                        {primaryImage ? (
                          <Image
                            src={primaryImage}
                            alt={item.product.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag size={20} className="text-[#ccc]" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/products/${item.product.slug}`}
                              className="text-sm font-semibold text-[#111] truncate block hover:text-[#c9a96e] transition-colors"
                            >
                              {item.product.name}
                            </Link>
                            <span className="inline-block mt-1 text-[11px] font-semibold tracking-widest uppercase bg-[#f5f5f5] text-[#555] px-2 py-0.5 border border-[#e8e8e8]">
                              {item.variant.size}
                            </span>
                          </div>

                          {/* Remove button */}
                          <button
                            onClick={() => handleRemove(item.id)}
                            disabled={isRemoving}
                            className="text-[#bbb] hover:text-[#111] transition-colors shrink-0 mt-0.5"
                            aria-label="Remove item"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* Quantity + Price */}
                        <div className="flex items-center justify-between mt-3">
                          {/* Qty selector */}
                          <div className="flex items-center border border-[#e8e8e8]">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={isUpdating || isRemoving}
                              className="w-8 h-8 flex items-center justify-center text-[#555] hover:bg-[#f5f5f5] transition-colors disabled:opacity-40"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 h-8 flex items-center justify-center text-sm font-semibold text-[#111]">
                              {isUpdating ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                item.quantity
                              )}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              disabled={
                                isUpdating ||
                                isRemoving ||
                                item.quantity >= item.variant.stock
                              }
                              className="w-8 h-8 flex items-center justify-center text-[#555] hover:bg-[#f5f5f5] transition-colors disabled:opacity-40"
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <span className="text-sm font-bold text-[#111]">
                            ₹{itemTotal.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Stock warning */}
                        {item.variant.stock <= 5 && (
                          <p className="text-[11px] text-amber-600 mt-1.5 font-medium">
                            Only {item.variant.stock} left in stock
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Continue Shopping */}
            {!isLoading && items.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[#f0f0f0]">
                <Link
                  href="/shop"
                  className="text-sm text-[#888] hover:text-[#111] transition-colors inline-flex items-center gap-2 font-medium"
                >
                  &larr; Continue Shopping
                </Link>
              </div>
            )}
          </div>

          {/* ── RIGHT: Order Summary ───────────────────────────────────────── */}
          {!isLoading && items.length > 0 && (
            <div className="bg-[#fafafa] border border-[#f0f0f0] p-6 lg:p-8 sticky top-6">
              <h2 className="text-xs font-bold tracking-[0.35em] uppercase text-[#111] mb-6 pb-4 border-b border-[#ebebeb]">
                Order Summary
              </h2>

              {/* Line items */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[#555]">Subtotal</span>
                  <span className="font-semibold text-[#111]">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#555]">Delivery</span>
                  <span className="font-semibold text-[#111]">
                    {deliveryFee === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                {subtotal <= 999 && (
                  <p className="text-[11px] text-[#aaa]">
                    Add ₹{(999 - subtotal + 1).toLocaleString('en-IN')} more for free delivery
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-[#ebebeb] pt-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-sm font-bold text-[#111] tracking-wide">Total</span>
                  <span className="text-lg font-black text-[#111]">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Promo code */}
              <div className="mb-6">
                <div className="flex gap-0">
                  <input
                    type="text"
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 border border-[#e8e8e8] border-r-0 bg-white px-3 py-2.5 text-sm text-[#111] placeholder:text-[#bbb] outline-none focus:border-[#c9a96e] transition-colors"
                  />
                  <button
                    onClick={() => toast.info('Promo codes coming soon')}
                    className="border border-[#e8e8e8] bg-[#111] text-white text-xs font-bold tracking-widest uppercase px-4 py-2.5 hover:bg-[#333] transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/checkout"
                className="block w-full bg-[#111] text-white text-xs font-bold tracking-[0.25em] uppercase text-center py-4 hover:bg-[#333] transition-colors duration-200 mb-3"
              >
                Proceed to Checkout
              </Link>

              {/* Trust badges */}
              <p className="text-center text-[11px] text-[#aaa] tracking-wide">
                Secure checkout &bull; Free returns &bull; Encrypted payment
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
