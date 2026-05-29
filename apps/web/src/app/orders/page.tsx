'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag,
  Loader2,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { ordersApi, type Order } from '@/lib/api/orders';

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Pending',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    icon: <Clock size={12} />,
  },
  processing: {
    label: 'Processing',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    icon: <Package size={12} />,
  },
  shipped: {
    label: 'Shipped',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    icon: <Truck size={12} />,
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    icon: <Truck size={12} />,
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-700',
    bg: 'bg-green-50',
    icon: <CheckCircle size={12} />,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-700',
    bg: 'bg-red-50',
    icon: <XCircle size={12} />,
  },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Payment Pending', color: 'text-amber-600' },
  paid: { label: 'Paid', color: 'text-green-600' },
  failed: { label: 'Payment Failed', color: 'text-red-600' },
  refunded: { label: 'Refunded', color: 'text-blue-600' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function truncateId(id: string): string {
  return `#${id.slice(-8).toUpperCase()}`;
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    icon: <Clock size={12} />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide px-2.5 py-1 ${config.bg} ${config.color}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus] ?? {
    label: order.paymentStatus,
    color: 'text-gray-600',
  };
  const canTrack = ['shipped', 'out_for_delivery'].includes(order.status);

  return (
    <div className="bg-white border border-[#f0f0f0] overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-[#f0f0f0] flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-black text-[#111] tracking-wide font-mono">
              {truncateId(order.id)}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[#888]">
            <span>{formatDate(order.createdAt)}</span>
            <span className="capitalize">{order.paymentMethod.replace('_', ' ')}</span>
            <span className={`font-semibold ${paymentConfig.color}`}>{paymentConfig.label}</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-lg font-black text-[#111]">
            ₹{parseFloat(order.total).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#888]">
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Items Preview */}
      <div className="px-5 py-4">
        <div className="flex gap-3 flex-wrap mb-3">
          {order.items.slice(0, expanded ? undefined : 3).map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative w-14 h-14 shrink-0 bg-[#f5f5f5] overflow-hidden">
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={16} className="text-[#ccc]" />
                  </div>
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-[#111] max-w-[160px] truncate">
                  {item.productName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-[#888]">Size: {item.size}</span>
                  <span className="text-[11px] text-[#888]">Qty: {item.quantity}</span>
                </div>
                <p className="text-[11px] font-bold text-[#111] mt-0.5">
                  ₹{parseFloat(item.priceAtPurchase).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Expanded items on mobile */}
        {expanded && (
          <div className="sm:hidden space-y-3 mb-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 items-start">
                <div className="relative w-12 h-12 shrink-0 bg-[#f5f5f5] overflow-hidden">
                  {item.productImage ? (
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag size={14} className="text-[#ccc]" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[#111]">{item.productName}</p>
                  <p className="text-[11px] text-[#888]">
                    Size: {item.size} &bull; Qty: {item.quantity}
                  </p>
                  <p className="text-[11px] font-bold text-[#111]">
                    ₹{parseFloat(item.priceAtPurchase).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {order.items.length > 3 && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-[11px] text-[#888] hover:text-[#111] font-medium transition-colors"
          >
            +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Delivery Address (if available) */}
      {order.address && (
        <div className="px-5 py-3 border-t border-[#f0f0f0] flex items-start gap-2">
          <MapPin size={13} className="text-[#aaa] mt-0.5 shrink-0" />
          <p className="text-[11px] text-[#888]">
            {order.address.firstName} {order.address.lastName} &mdash;&nbsp;
            {order.address.street}, {order.address.city}, {order.address.state}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#f0f0f0] bg-[#fafafa] flex items-center justify-between gap-3 flex-wrap">
        {/* Order breakdown */}
        <div className="flex items-center gap-4 text-[11px] text-[#888]">
          <span>Subtotal: ₹{parseFloat(order.subtotal).toLocaleString('en-IN')}</span>
          <span>
            Delivery:{' '}
            {parseFloat(order.deliveryFee) === 0
              ? 'Free'
              : `₹${parseFloat(order.deliveryFee).toLocaleString('en-IN')}`}
          </span>
        </div>

        {/* Track Order button */}
        {canTrack && (
          <button className="inline-flex items-center gap-2 bg-[#111] text-white text-[11px] font-bold tracking-[0.2em] uppercase px-4 py-2 hover:bg-[#333] transition-colors">
            <Truck size={12} />
            Track Order
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OrderSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white border border-[#f0f0f0] p-5 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 bg-[#f0f0f0] rounded w-32" />
            <div className="h-4 bg-[#f0f0f0] rounded w-20" />
          </div>
          <div className="flex gap-3">
            {Array.from({ length: 3 }).map((__, j) => (
              <div key={j} className="w-14 h-14 bg-[#f0f0f0]" />
            ))}
          </div>
          <div className="h-3 bg-[#f0f0f0] rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/orders');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch orders
  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await ordersApi.getMyOrders();
        setOrders(data);
      } catch {
        setError('Failed to load orders. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#c9a96e]" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Page header */}
      <div className="bg-white border-b border-[#f0f0f0] px-6 md:px-12 lg:px-16 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#c9a96e] text-[10px] font-bold tracking-[0.4em] uppercase mb-1">
            Account
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111]">
            MY ORDERS
          </h1>
          {!isLoading && orders.length > 0 && (
            <p className="text-[#888] text-sm mt-1">
              {orders.length} order{orders.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16 py-10">

        {/* Loading */}
        {isLoading && <OrderSkeleton />}

        {/* Error */}
        {!isLoading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 text-center">
            {error}
            <button
              onClick={() => window.location.reload()}
              className="ml-3 underline font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
            <ShoppingBag size={56} strokeWidth={1} className="text-[#ccc]" />
            <div>
              <h2 className="text-2xl font-black tracking-tight text-[#111] mb-2">
                No orders yet
              </h2>
              <p className="text-[#888] text-sm tracking-wide">
                Your order history will appear here once you make a purchase.
              </p>
            </div>
            <Link
              href="/shop"
              className="bg-[#111] text-white text-xs font-bold tracking-[0.2em] uppercase px-8 py-4 hover:bg-[#333] transition-colors duration-200 inline-flex items-center gap-2"
            >
              Start Shopping <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Orders list */}
        {!isLoading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
