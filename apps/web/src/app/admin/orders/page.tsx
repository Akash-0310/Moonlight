'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Loader2 } from 'lucide-react';
import { ordersApi, type Order } from '@/lib/api/orders';

const ORDER_STATUSES = [
  'All',
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;

type FilterStatus = (typeof ORDER_STATUSES)[number];

const STATUS_FLOW = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-600',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-600',
  paid: 'text-green-600',
  failed: 'text-red-600',
  refunded: 'text-gray-500',
};

interface AdminOrder extends Order {
  user?: { name: string; email: string };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ordersApi.getAll();
      setOrders(data as AdminOrder[]);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
      toast.success('Order status updated');
    } catch {
      toast.error('Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered =
    filterStatus === 'All'
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Status filter */}
        <div className="flex flex-wrap gap-1">
          {ORDER_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-2 text-xs font-semibold rounded capitalize transition-colors ${
                filterStatus === status
                  ? 'bg-[#111] text-white'
                  : 'border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <button
          onClick={() => void fetchOrders()}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-2 border border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-widest px-4 py-2.5 hover:border-gray-300 transition-colors disabled:opacity-60"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
        <span className="text-xs text-gray-400">
          {filtered.length} order{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {[
                    'Order ID',
                    'Customer',
                    'Items',
                    'Amount',
                    'Payment',
                    'Pay Status',
                    'Order Status',
                    'Date',
                    'Update',
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    {/* Order ID */}
                    <td className="px-5 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                      #{order.id.slice(-8).toUpperCase()}
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <p className="font-medium text-[#111] text-sm">
                        {order.user?.name ?? 'N/A'}
                      </p>
                      {order.user?.email && (
                        <p className="text-xs text-gray-400">{order.user.email}</p>
                      )}
                    </td>

                    {/* Items */}
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                      <div className="space-y-0.5 max-w-[180px]">
                        {order.items.slice(0, 2).map((item) => (
                          <p key={item.id} className="text-xs text-gray-500 truncate">
                            {item.productName} ({item.size}) x{item.quantity}
                          </p>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-xs text-gray-400">
                            +{order.items.length - 2} more
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3 font-semibold text-[#111] whitespace-nowrap">
                      ₹{parseFloat(order.total).toLocaleString('en-IN')}
                    </td>

                    {/* Payment Method */}
                    <td className="px-5 py-3 text-gray-600 uppercase text-xs whitespace-nowrap">
                      {order.paymentMethod}
                    </td>

                    {/* Payment Status */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold capitalize ${
                          PAYMENT_STATUS_COLORS[order.paymentStatus] ?? 'text-gray-600'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    {/* Order Status badge */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Status Update Dropdown */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      {updatingId === order.id ? (
                        <Loader2 size={14} className="animate-spin text-gray-400" />
                      ) : (
                        <select
                          value={order.status}
                          onChange={(e) => void handleStatusChange(order.id, e.target.value)}
                          className="border border-gray-200 rounded px-2 py-1.5 text-xs text-[#111] outline-none focus:border-[#c9a96e] bg-white capitalize transition-colors"
                        >
                          {STATUS_FLOW.map((s) => (
                            <option key={s} value={s} className="capitalize">
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
