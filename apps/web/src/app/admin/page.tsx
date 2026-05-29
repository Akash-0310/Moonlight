'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  ShoppingCart,
  Clock,
  IndianRupee,
  PlusSquare,
  RefreshCw,
} from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { ordersApi, type Order } from '@/lib/api/orders';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  revenue: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-600',
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, ordersData] = await Promise.all([
        productsApi.list({ limit: 1, page: 1 }),
        ordersApi.getAll(),
      ]);

      const pendingOrders = ordersData.filter((o) => o.status === 'pending').length;
      const revenue = ordersData
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + parseFloat(o.total), 0);

      setStats({
        totalProducts: productsData.total,
        totalOrders: ordersData.length,
        pendingOrders,
        revenue,
      });
      setRecentOrders(ordersData.slice(0, 10));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const statCards = stats
    ? [
        {
          label: 'Total Products',
          value: stats.totalProducts.toLocaleString(),
          icon: Package,
          color: 'bg-blue-50 text-blue-600',
        },
        {
          label: 'Total Orders',
          value: stats.totalOrders.toLocaleString(),
          icon: ShoppingCart,
          color: 'bg-purple-50 text-purple-600',
        },
        {
          label: 'Pending Orders',
          value: stats.pendingOrders.toLocaleString(),
          icon: Clock,
          color: 'bg-yellow-50 text-yellow-600',
        },
        {
          label: 'Revenue (Delivered)',
          value: `₹${stats.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
          icon: IndianRupee,
          color: 'bg-green-50 text-green-600',
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-5 border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
                <div className="h-7 bg-gray-100 rounded w-2/3" />
              </div>
            ))
          : statCards.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="bg-white rounded-lg p-5 border border-gray-100 flex items-center gap-4"
              >
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium tracking-wide">{label}</p>
                  <p className="text-2xl font-bold text-[#111] leading-tight">{value}</p>
                </div>
              </div>
            ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/add"
          className="inline-flex items-center gap-2 bg-[#111] text-white text-xs font-bold tracking-widest uppercase px-5 py-3 hover:bg-[#222] transition-colors"
        >
          <PlusSquare size={14} />
          Add Product
        </Link>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 border border-[#111] text-[#111] text-xs font-bold tracking-widest uppercase px-5 py-3 hover:bg-[#f5f5f5] transition-colors"
        >
          <ShoppingCart size={14} />
          View All Orders
        </Link>
        <button
          onClick={() => void fetchData()}
          className="inline-flex items-center gap-2 border border-gray-200 text-gray-500 text-xs font-bold tracking-widest uppercase px-5 py-3 hover:border-gray-300 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#111] tracking-wide uppercase">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-xs text-[#c9a96e] font-semibold hover:underline"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">No orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => {
                  const adminOrder = order as Order & {
                    user?: { name: string; email: string };
                  };
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-gray-500">
                        #{order.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-3 text-[#111] font-medium">
                        {adminOrder.user?.name ?? 'N/A'}
                      </td>
                      <td className="px-6 py-3 text-[#111] font-semibold">
                        ₹{parseFloat(order.total).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                            STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => router.push('/admin/orders')}
                          className="text-xs text-[#c9a96e] font-semibold hover:underline"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
