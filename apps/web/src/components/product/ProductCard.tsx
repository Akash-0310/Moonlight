'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import type { Product } from '@/lib/api/products';
import { useAuthStore } from '@/lib/store/auth.store';
import { useWishlistStore } from '@/lib/store/wishlist.store';

const formatPrice = (price: string | number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
    typeof price === 'string' ? parseFloat(price) : price
  );

interface ProductCardProps {
  product: Product;
  priority?: boolean; // true for first 4 above-fold cards
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { isWishlisted, toggleItem } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);

  const primaryImage =
    product.images?.find((img) => img.isPrimary) ?? product.images?.[0];

  const rawUrl = primaryImage?.url ?? '';
  // Downscale Unsplash images for card thumbnails — saves 40-60% bandwidth
  const optimizedUrl = rawUrl.includes('unsplash.com')
    ? rawUrl.replace(/[?&]w=\d+/, '').replace(/[?&]q=\d+/, '') +
      (rawUrl.includes('?') ? '&' : '?') + 'w=640&q=75&auto=format&fit=crop'
    : rawUrl;

  const imageSrc = !imgError && rawUrl
    ? optimizedUrl
    : 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=640&q=75&auto=format';

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={10}
        className={
          i < Math.floor(rating)
            ? 'fill-[#c9a96e] text-[#c9a96e]'
            : 'fill-transparent text-[#ccc]'
        }
      />
    ));
  };

  return (
    <Link href={`/product/${product.slug}`} className="group relative block cursor-pointer">
      {/* Image container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f5f5]">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          onError={() => setImgError(true)}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
        />

        {/* Bestseller badge */}
        {product.isBestseller && (
          <span className="absolute top-3 left-3 bg-[#c9a96e] text-[#111] text-[9px] font-black tracking-[0.2em] uppercase px-2 py-1">
            BESTSELLER
          </span>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

        {/* Wishlist button — top right, appears on hover */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isAuthenticated) { router.push('/login'); return; }
            toggleItem(product.id);
          }}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={14}
            className={wishlisted ? 'fill-red-500 text-red-500' : 'text-[#111]'}
          />
        </button>

        {/* Add to cart — slides up from bottom on hover */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isAuthenticated) { router.push('/login'); return; }
            router.push(`/product/${product.slug}`);
          }}
          className="absolute bottom-0 left-0 right-0 bg-[#111] text-white text-[10px] font-bold tracking-[0.2em] uppercase py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2"
        >
          <ShoppingBag size={13} />
          Quick Add
        </button>
      </div>

      {/* Info */}
      <div className="pt-3 pb-4 px-0.5">
        <p className="text-[10px] tracking-widest uppercase text-[#888] mb-1 font-medium">
          {product.subCategory || product.category}
        </p>

        <h3 className="text-sm font-medium text-[#111] truncate leading-snug mb-1">
          {product.name}
        </h3>

        {/* Rating */}
        {product.avgRating > 0 && (
          <div className="flex items-center gap-1.5 mb-1">
            <div className="flex items-center gap-0.5">
              {renderStars(product.avgRating)}
            </div>
            <span className="text-[10px] text-[#888]">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Price */}
        <span className="text-sm font-bold text-[#111]">
          {formatPrice(product.price)}
        </span>
      </div>
    </Link>
  );
}
