'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, X, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { useWishlistStore } from '@/lib/store/wishlist.store';

const formatPrice = (price: string | number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
    typeof price === 'string' ? parseFloat(price) : price
  );

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { items, isLoading, fetchWishlist, removeItem } = useWishlistStore();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/wishlist');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch wishlist when authenticated
  useEffect(() => {
    if (isAuthenticated) fetchWishlist();
  }, [isAuthenticated, fetchWishlist]);

  if (authLoading || (isAuthenticated && isLoading && items.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#111]" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!isLoading && items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-6 text-center">
        <Heart size={56} strokeWidth={1} className="text-[#ccc]" />
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#111] mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-[#888] text-sm tracking-wide">
            Save the pieces you love and come back when you&apos;re ready.
          </p>
        </div>
        <Link
          href="/collection"
          className="bg-[#111] text-white text-xs font-bold tracking-[0.2em] uppercase px-8 py-4 hover:bg-[#333] transition-colors inline-flex items-center gap-2"
        >
          Browse Collection <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  // ── Wishlist layout ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">

      {/* Page header */}
      <div className="border-b border-[#f0f0f0] px-6 md:px-12 lg:px-16 py-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#c9a96e] text-[10px] font-bold tracking-[0.4em] uppercase mb-1">
            MoonLight
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111]">
            YOUR WISHLIST
          </h1>
          <p className="text-[#888] text-sm mt-1">
            {items.length} saved piece{items.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-10">

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map(({ productId, product }) => {
            const image =
              product.images.find((i) => i.isPrimary)?.url ??
              product.images[0]?.url ?? '';

            return (
              <div key={productId} className="group relative">
                {/* Remove button */}
                <button
                  onClick={() => removeItem(productId)}
                  className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  aria-label="Remove from wishlist"
                >
                  <X size={13} className="text-[#111]" />
                </button>

                <Link href={`/product/${product.slug}`} className="block">
                  {/* Image */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f5f5] mb-3">
                    {image ? (
                      <Image
                        src={image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Heart size={24} className="text-[#ccc]" />
                      </div>
                    )}

                    {product.isBestseller && (
                      <span className="absolute top-3 left-3 bg-[#c9a96e] text-[#111] text-[9px] font-black tracking-[0.2em] uppercase px-2 py-1">
                        BESTSELLER
                      </span>
                    )}

                    {/* View product overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-[#111] text-white text-[10px] font-bold tracking-[0.2em] uppercase py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2">
                      <ShoppingBag size={13} />
                      View Product
                    </div>
                  </div>

                  {/* Info */}
                  <p className="text-[10px] tracking-widest uppercase text-[#888] mb-1 font-medium">
                    {product.subCategory || product.category}
                  </p>
                  <h3 className="text-sm font-medium text-[#111] truncate leading-snug mb-1">
                    {product.name}
                  </h3>
                  <span className="text-sm font-bold text-[#111]">
                    {formatPrice(product.price)}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-[#f0f0f0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            href="/collection"
            className="text-sm text-[#888] hover:text-[#111] transition-colors font-medium inline-flex items-center gap-2"
          >
            &larr; Continue Shopping
          </Link>
          <p className="text-xs text-[#bbb] tracking-wide">
            Items in your wishlist are not reserved — add them to your cart to secure them.
          </p>
        </div>
      </div>
    </div>
  );
}
