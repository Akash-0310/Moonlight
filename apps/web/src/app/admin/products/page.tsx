'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Edit2, Trash2, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { productsApi, type Product } from '@/lib/api/products';

const CATEGORIES = ['All', 'Men', 'Women', 'Kids'];
const PAGE_SIZE = 10;

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: PAGE_SIZE,
      };
      if (search.trim()) params.search = search.trim();
      if (category !== 'All') params.category = category;

      const res = await productsApi.list(params);
      setProducts(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, category]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await productsApi.remove(id);
      toast.success('Product removed');
      setConfirmId(null);
      void fetchProducts();
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full border border-gray-200 rounded pl-8 pr-3 py-2.5 text-sm outline-none focus:border-[#c9a96e] transition-colors"
          />
        </div>
        <div className="flex gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-2 text-xs font-semibold rounded transition-colors ${
                category === cat
                  ? 'bg-[#111] text-white'
                  : 'border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-auto">{total} product{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No products found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Sub-Cat
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Sizes
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Bestseller
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => {
                  const primaryImg =
                    product.images.find((img) => img.isPrimary)?.url ??
                    product.images[0]?.url ??
                    '';
                  const sizes = product.variants.map((v) => v.size).join(', ');
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="relative w-10 h-10 bg-gray-100 rounded overflow-hidden shrink-0">
                          {primaryImg ? (
                            <Image
                              src={primaryImg}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 font-medium text-[#111] max-w-[200px] truncate">
                        {product.name}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{product.category}</td>
                      <td className="px-5 py-3 text-gray-600">{product.subCategory}</td>
                      <td className="px-5 py-3 font-semibold text-[#111]">
                        ₹{parseFloat(product.price).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs max-w-[120px] truncate">
                        {sizes || '—'}
                      </td>
                      <td className="px-5 py-3">
                        {product.isBestseller ? (
                          <span className="inline-block bg-[#c9a96e]/10 text-[#b8955a] text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded">
                            Yes
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">No</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/edit/${product.id}`)}
                            className="p-1.5 text-gray-400 hover:text-[#111] hover:bg-gray-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          {confirmId === product.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => void handleDelete(product.id)}
                                disabled={deletingId === product.id}
                                className="text-[10px] bg-red-500 text-white px-2 py-1 rounded font-semibold disabled:opacity-60"
                              >
                                {deletingId === product.id ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  'Confirm'
                                )}
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="text-[10px] border border-gray-200 text-gray-500 px-2 py-1 rounded font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmId(product.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-gray-200 rounded text-gray-600 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 text-xs rounded font-semibold transition-colors ${
                    page === pageNum
                      ? 'bg-[#111] text-white'
                      : 'border border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-gray-200 rounded text-gray-600 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
