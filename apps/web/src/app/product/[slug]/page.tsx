'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  Heart,
  Minus,
  Plus,
  Truck,
  RefreshCw,
  Share2,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import { productsApi, type Product } from '@/lib/api/products';
import { useCartStore } from '@/lib/store/cart.store';
import { useAuthStore } from '@/lib/store/auth.store';
import { useWishlistStore } from '@/lib/store/wishlist.store';
import ProductCard from '@/components/product/ProductCard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatPrice = (price: string | number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
    typeof price === 'string' ? parseFloat(price) : price
  );

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

// ─── Rating stars ─────────────────────────────────────────────────────────────

function RatingStars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={
            i < Math.floor(rating)
              ? 'fill-[#c9a96e] text-[#c9a96e]'
              : i < rating
              ? 'fill-[#c9a96e]/40 text-[#c9a96e]'
              : 'fill-transparent text-[#ddd]'
          }
        />
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-10 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <div>
          <div className="aspect-[3/4] bg-[#f0f0f0] mb-4" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-20 aspect-square bg-[#f0f0f0]" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-3 bg-[#f0f0f0] w-1/2" />
          <div className="h-8 bg-[#f0f0f0] w-3/4" />
          <div className="h-4 bg-[#f0f0f0] w-1/3" />
          <div className="h-6 bg-[#f0f0f0] w-1/4" />
          <div className="h-20 bg-[#f0f0f0]" />
          <div className="flex gap-2">
            {SIZES.map((s) => (
              <div key={s} className="w-12 h-12 bg-[#f0f0f0]" />
            ))}
          </div>
          <div className="h-12 bg-[#f0f0f0]" />
          <div className="h-12 bg-[#f0f0f0] w-1/2" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const addItem = useCartStore((s) => s.addItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isWishlisted, toggleItem: toggleWishlist } = useWishlistStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const wishlisted = product ? isWishlisted(product.id) : false;
  const [addedToCart, setAddedToCart] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  // ── Fetch product ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchProduct = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await productsApi.getBySlug(slug);
        if (cancelled) return;
        setProduct(data);

        // Fetch related products from same category
        try {
          const related = await productsApi.list({
            category: data.category,
            limit: 4,
            excludeId: data.id,
          });
          if (!cancelled) {
            setRelatedProducts(related.items?.filter((p) => p.id !== data.id).slice(0, 4) ?? []);
          }
        } catch {
          // related products are optional, ignore error
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProduct();
    return () => { cancelled = true; };
  }, [slug]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const images = product?.images?.sort((a, b) => a.sortOrder - b.sortOrder) ?? [];
  const displayImages = images.length > 0 ? images : [];

  const selectedVariant = product?.variants?.find(
    (v) => v.size.toUpperCase() === selectedSize?.toUpperCase()
  );

  const stockForSize = (size: string) =>
    product?.variants?.find((v) => v.size.toUpperCase() === size.toUpperCase())?.stock ?? 0;

  const maxQty = selectedVariant?.stock ?? 10;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!product || !selectedVariant) return;

    await addItem(product.id, selectedVariant.id, quantity);

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product?.name,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <h2 className="text-2xl font-black text-[#111] mb-3">Product Not Found</h2>
        <p className="text-[#888] text-sm mb-8">
          This product may have been removed or the link is incorrect.
        </p>
        <Link
          href="/collection"
          className="bg-[#111] text-white text-xs font-bold tracking-widest uppercase px-8 py-3 hover:bg-[#333] transition-colors"
        >
          Back to Collection
        </Link>
      </div>
    );
  }

  const currentImage =
    displayImages[selectedImageIndex]?.url ??
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80';

  return (
    <div className="bg-white text-[#111]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-8 md:py-12">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-[11px] tracking-wide text-[#aaa] mb-8 flex-wrap">
          <Link href="/" className="hover:text-[#111] transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/collection" className="hover:text-[#111] transition-colors">Collection</Link>
          <ChevronRight size={12} />
          <Link
            href={`/collection?category=${product.category}`}
            className="hover:text-[#111] transition-colors"
          >
            {product.category}
          </Link>
          <ChevronRight size={12} />
          <span className="text-[#555] truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* ── Product layout ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

          {/* ── Left: Images ─────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {/* Main image */}
            <div className="relative aspect-[3/4] bg-[#f5f5f5] overflow-hidden mb-3">
              <Image
                src={imgErrors[selectedImageIndex] ? 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80' : currentImage}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-opacity duration-300"
                onError={() => setImgErrors((prev) => ({ ...prev, [selectedImageIndex]: true }))}
              />
              {product.isBestseller && (
                <span className="absolute top-4 left-4 bg-[#c9a96e] text-[#111] text-[9px] font-black tracking-[0.2em] uppercase px-3 py-1.5">
                  BESTSELLER
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {displayImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {displayImages.map((img, idx) => (
                  <button
                    key={img.id ?? idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 aspect-square shrink-0 overflow-hidden border-2 transition-colors ${
                      idx === selectedImageIndex
                        ? 'border-[#111]'
                        : 'border-transparent hover:border-[#aaa]'
                    }`}
                  >
                    <Image
                      src={imgErrors[idx] ? 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=200&q=80' : img.url}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                      onError={() => setImgErrors((prev) => ({ ...prev, [idx]: true }))}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Product info ──────────────────────────────────────── */}
          <div className="flex flex-col">

            {/* Category tag */}
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#888] font-semibold mb-3">
              {product.subCategory || product.category}
            </p>

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#111] leading-tight mb-4">
              {product.name}
            </h1>

            {/* Rating + review count */}
            {product.avgRating > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <RatingStars rating={product.avgRating} />
                <span className="text-xs text-[#888]">
                  {product.avgRating.toFixed(1)} ({product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Price */}
            <p className="text-2xl font-black text-[#111] mb-6">
              {formatPrice(product.price)}
            </p>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-[#555] leading-relaxed mb-8 border-t border-[#f0f0f0] pt-6">
                {product.description}
              </p>
            )}

            {/* Size selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#111]">
                  Select Size
                </p>
                {selectedSize && selectedVariant && (
                  <p className="text-xs text-[#888]">
                    {selectedVariant.stock > 0
                      ? `${selectedVariant.stock} in stock`
                      : 'Out of stock'}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {SIZES.map((size) => {
                  const stock = stockForSize(size);
                  const outOfStock = stock === 0;
                  const isSelected = selectedSize === size;

                  return (
                    <button
                      key={size}
                      onClick={() => {
                        if (!outOfStock) {
                          setSelectedSize(size);
                          setSizeError(false);
                          setQuantity(1);
                        }
                      }}
                      disabled={outOfStock}
                      className={`w-12 h-12 text-xs font-bold tracking-wide border-2 transition-all duration-150 ${
                        isSelected
                          ? 'border-[#111] bg-[#111] text-white'
                          : outOfStock
                          ? 'border-[#eee] text-[#ccc] cursor-not-allowed line-through'
                          : 'border-[#ddd] text-[#444] hover:border-[#111]'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              {sizeError && (
                <p className="text-xs text-red-500 mt-2 font-medium">
                  Please select a size to continue.
                </p>
              )}
            </div>

            {/* Quantity selector */}
            <div className="mb-8">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#111] mb-3">
                Quantity
              </p>
              <div className="inline-flex items-center border border-[#ddd]">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 flex items-center justify-center hover:bg-[#f5f5f5] transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-12 text-center text-sm font-bold select-none">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  disabled={quantity >= maxQty}
                  className="w-11 h-11 flex items-center justify-center hover:bg-[#f5f5f5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                className={`w-full py-4 text-xs font-black tracking-[0.25em] uppercase flex items-center justify-center gap-3 transition-colors duration-200 ${
                  addedToCart
                    ? 'bg-green-600 text-white'
                    : 'bg-[#111] text-white hover:bg-[#333]'
                }`}
              >
                <ShoppingBag size={16} />
                {addedToCart ? 'Added to Cart!' : 'Add to Cart'}
              </button>

              <button
                onClick={() => {
                  if (!isAuthenticated) { router.push('/login'); return; }
                  if (product) toggleWishlist(product.id);
                }}
                className={`w-full py-4 text-xs font-black tracking-[0.25em] uppercase flex items-center justify-center gap-3 border-2 transition-colors duration-200 ${
                  wishlisted
                    ? 'border-red-500 text-red-500 bg-red-50'
                    : 'border-[#ddd] text-[#444] hover:border-[#111] hover:text-[#111]'
                }`}
              >
                <Heart size={16} className={wishlisted ? 'fill-red-500' : ''} />
                {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
              </button>
            </div>

            {/* Delivery info */}
            <div className="border border-[#f0f0f0] p-5 flex flex-col gap-4 mb-6">
              <div className="flex items-start gap-3">
                <Truck size={16} className="text-[#c9a96e] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#111] mb-0.5">Free Delivery</p>
                  <p className="text-xs text-[#888]">On orders above ₹999. Usually delivered in 3–5 business days.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RefreshCw size={16} className="text-[#c9a96e] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#111] mb-0.5">Easy 30-Day Returns</p>
                  <p className="text-xs text-[#888]">Not happy? Return within 30 days for a full refund.</p>
                </div>
              </div>
            </div>

            {/* Share */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 text-xs text-[#888] hover:text-[#111] transition-colors self-start"
            >
              <Share2 size={14} />
              <span className="tracking-wide">Share this product</span>
            </button>
          </div>
        </div>

        {/* ── Related Products ──────────────────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 md:mt-28 border-t border-[#f0f0f0] pt-16">
            <div className="flex flex-col items-center text-center mb-12">
              <div className="flex items-center gap-4 mb-4">
                <span className="block w-16 h-px bg-[#c9a96e]" />
                <span className="text-[#c9a96e] text-[10px] font-bold tracking-[0.4em] uppercase">
                  You May Also Like
                </span>
                <span className="block w-16 h-px bg-[#c9a96e]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#111]">
                Related Products
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
