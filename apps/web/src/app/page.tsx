'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api/products';
import { useAuthStore } from '@/lib/store/auth.store';
import {
  Truck,
  RefreshCw,
  Shield,
  Headphones,
  ChevronDown,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string | number;
  slug?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category?: string;
}

// ─── Static placeholder products (used if API is unavailable) ─────────────────

const PLACEHOLDER_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Oversized Linen Blazer',
    price: 3499,
    originalPrice: 4999,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80',
    category: 'Women',
  },
  {
    id: 2,
    name: 'Slim Fit Chinos',
    price: 1799,
    originalPrice: 2499,
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80',
    category: 'Men',
  },
  {
    id: 3,
    name: 'Floral Midi Dress',
    price: 2299,
    originalPrice: 3199,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
    category: 'Women',
  },
  {
    id: 4,
    name: 'Classic White Tee',
    price: 799,
    originalPrice: 1199,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
    category: 'Men',
  },
  {
    id: 5,
    name: 'Ribbed Knit Sweater',
    price: 2599,
    originalPrice: 3499,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80',
    category: 'Women',
  },
  {
    id: 6,
    name: 'Cargo Joggers',
    price: 1499,
    originalPrice: 1999,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
    category: 'Men',
  },
  {
    id: 7,
    name: 'Denim Jacket',
    price: 2899,
    originalPrice: 3999,
    image: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=600&q=80',
    category: 'Unisex',
  },
  {
    id: 8,
    name: 'Pleated Trousers',
    price: 2199,
    originalPrice: 2999,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4767?w=600&q=80',
    category: 'Women',
  },
];

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const discount =
    product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const href = product.slug ? `/product/${product.slug}` : '/collection';
  const imageSrc = !imgError && product.image
    ? product.image
    : 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80';

  return (
    <Link href={href} className="group relative bg-white overflow-hidden block cursor-pointer">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f5f5]">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
        {discount && (
          <span className="absolute top-3 left-3 bg-[#111] text-white text-[10px] font-semibold tracking-widest px-2 py-1 uppercase">
            -{discount}%
          </span>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        <button
          className="absolute bottom-0 left-0 right-0 bg-[#111] text-white text-xs font-semibold tracking-widest uppercase py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isAuthenticated) { router.push('/login'); return; }
            router.push(product.slug ? `/product/${product.slug}` : '/collection');
          }}
        >
          <ShoppingBag size={14} />
          Quick Add
        </button>
      </div>
      <div className="pt-3 pb-4 px-1">
        <p className="text-[11px] tracking-widest uppercase text-[#888] mb-1">{product.category}</p>
        <h3 className="text-sm font-medium text-[#111] truncate leading-snug">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold text-[#111]">₹{product.price.toLocaleString('en-IN')}</span>
          {product.originalPrice && (
            <span className="text-xs text-[#aaa] line-through">
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Category Card ────────────────────────────────────────────────────────────

function CategoryCard({
  name,
  image,
  href,
}: {
  name: string;
  image: string;
  href: string;
}) {
  return (
    <Link href={href} className="group relative block overflow-hidden aspect-[3/4]">
      <Image
        src={image}
        alt={name}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <h3 className="text-white text-3xl md:text-4xl font-bold tracking-tight mb-2">{name}</h3>
        <span className="inline-flex items-center gap-2 text-white/80 text-xs tracking-widest uppercase font-medium group-hover:gap-3 transition-all duration-300">
          Shop Now <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [latestProducts, setLatestProducts] = useState<Product[]>(PLACEHOLDER_PRODUCTS.slice(0, 4));
  const [bestsellers, setBestsellers] = useState<Product[]>(PLACEHOLDER_PRODUCTS.slice(4, 8));
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [latest, bestsellers] = await Promise.all([
          productsApi.getLatest(),
          productsApi.getBestsellers(),
        ]);
        if (latest.length > 0) {
          setLatestProducts(latest.slice(0, 4).map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: parseFloat(p.price),
            image: p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? '',
            category: p.category,
          })));
        }
        if (bestsellers.length > 0) {
          setBestsellers(bestsellers.slice(0, 4).map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: parseFloat(p.price),
            image: p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? '',
            category: p.category,
          })));
        }
      } catch {
        // fall back to placeholders silently
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <main className="bg-white text-[#111]">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen bg-[#111] flex items-center overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,.05) 2px, rgba(255,255,255,.05) 4px)',
          }}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-24 lg:py-0">

          {/* Left – copy */}
          <div className="flex flex-col items-start">
            <span className="text-[#c9a96e] text-[11px] font-semibold tracking-[0.35em] uppercase mb-6">
              New Season — SS 2025
            </span>

            <h1 className="text-[clamp(3.5rem,9vw,7.5rem)] font-black leading-[0.92] tracking-tight text-white mb-6">
              MOON<br />
              <span className="text-[#c9a96e]">LIGHT</span>
            </h1>

            <p className="text-white/60 text-base md:text-lg font-light tracking-wide mb-10 max-w-sm leading-relaxed">
              Premium Fashion for Everyone.<br />
              Curated collections that define modern style.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                href="/shop"
                className="bg-[#c9a96e] text-[#111] text-xs font-bold tracking-[0.2em] uppercase px-8 py-4 hover:bg-[#b8955a] transition-colors duration-200"
              >
                Shop Collection
              </Link>
              <Link
                href="/sale"
                className="border border-white/30 text-white text-xs font-bold tracking-[0.2em] uppercase px-8 py-4 hover:border-white hover:bg-white/5 transition-all duration-200"
              >
                Explore Deals
              </Link>
            </div>

            {/* Free delivery badge */}
            <div className="flex items-center gap-3 border border-white/10 px-4 py-3 bg-white/5 backdrop-blur-sm">
              <Truck size={16} className="text-[#c9a96e] shrink-0" />
              <span className="text-white/70 text-xs tracking-wide">
                Free delivery on orders above <strong className="text-white">₹999</strong>
              </span>
            </div>
          </div>

          {/* Right – editorial image */}
          <div className="relative w-full aspect-[4/5] lg:aspect-auto lg:h-[75vh] rounded-none overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80"
              alt="MoonLight Editorial"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111]/60 via-transparent to-transparent" />

            {/* Floating label */}
            <div className="absolute top-6 right-6 bg-[#c9a96e] text-[#111] text-[10px] font-black tracking-[0.25em] uppercase px-3 py-2 rotate-3">
              SS 2025
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce">
          <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
          <ChevronDown size={16} />
        </div>
      </section>

      {/* ── CATEGORY BANNER ──────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3">
        <CategoryCard
          name="Men"
          image="https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800&q=90"
          href="/collection?category=Men"
        />
        <CategoryCard
          name="Women"
          image="https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&q=90"
          href="/collection?category=Women"
        />
        <CategoryCard
          name="Kids"
          image="https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&q=90"
          href="/collection?category=Kids"
        />
      </section>

      {/* ── NEW ARRIVALS ─────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
        {/* Section header */}
        <div className="flex flex-col items-center text-center mb-14">
          <div className="flex items-center gap-4 mb-4">
            <span className="block w-16 h-px bg-[#c9a96e]" />
            <span className="text-[#c9a96e] text-[10px] font-bold tracking-[0.4em] uppercase">
              Just Landed
            </span>
            <span className="block w-16 h-px bg-[#c9a96e]" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#111] mb-3">
            NEW ARRIVALS
          </h2>
          <p className="text-[#888] text-sm tracking-wide">Fresh styles just landed</p>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-[#f0f0f0] mb-3" />
                <div className="h-3 bg-[#f0f0f0] w-3/4 mb-2" />
                <div className="h-3 bg-[#f0f0f0] w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="flex justify-center mt-12">
          <Link
            href="/shop/new"
            className="border border-[#111] text-[#111] text-xs font-bold tracking-[0.25em] uppercase px-10 py-4 hover:bg-[#111] hover:text-white transition-all duration-200 inline-flex items-center gap-3"
          >
            View All New Arrivals <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── PROMOTIONAL BANNER ───────────────────────────────────────────── */}
      <section className="bg-[#111] py-16 px-6 text-center">
        <p className="text-[#c9a96e] text-[10px] tracking-[0.4em] uppercase font-bold mb-3">
          Limited Time
        </p>
        <h2 className="text-white text-4xl md:text-6xl font-black tracking-tight mb-6">
          UP TO 50% OFF
        </h2>
        <p className="text-white/50 text-sm tracking-wide mb-8">
          On selected styles from our seasonal edit
        </p>
        <Link
          href="/sale"
          className="bg-[#c9a96e] text-[#111] text-xs font-bold tracking-[0.25em] uppercase px-10 py-4 hover:bg-[#b8955a] transition-colors duration-200 inline-block"
        >
          Shop the Sale
        </Link>
      </section>

      {/* ── BESTSELLERS ──────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-14">
          <div className="flex items-center gap-4 mb-4">
            <span className="block w-16 h-px bg-[#c9a96e]" />
            <span className="text-[#c9a96e] text-[10px] font-bold tracking-[0.4em] uppercase">
              Most Loved
            </span>
            <span className="block w-16 h-px bg-[#c9a96e]" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[#111] mb-3">
            BESTSELLERS
          </h2>
          <p className="text-[#888] text-sm tracking-wide">Styles our customers can't stop buying</p>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex md:grid md:grid-cols-4 gap-4 md:gap-6 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory md:snap-none scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
          {bestsellers.map((product) => (
            <div key={product.id} className="min-w-[72vw] sm:min-w-[42vw] md:min-w-0 snap-start shrink-0 md:shrink">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <Link
            href="/shop/bestsellers"
            className="border border-[#111] text-[#111] text-xs font-bold tracking-[0.25em] uppercase px-10 py-4 hover:bg-[#111] hover:text-white transition-all duration-200 inline-flex items-center gap-3"
          >
            View All Bestsellers <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── EDITORIAL STRIP ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden h-64 md:h-80 bg-[#f7f5f2]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="whitespace-nowrap flex gap-12 animate-[marquee_20s_linear_infinite] text-[#111]/5 text-[8rem] md:text-[12rem] font-black tracking-tight select-none pointer-events-none">
            <span>MOONLIGHT</span>
            <span>FASHION</span>
            <span>STYLE</span>
            <span>MOONLIGHT</span>
            <span>FASHION</span>
            <span>STYLE</span>
          </div>
        </div>
        <div className="relative z-10 flex items-center justify-center h-full flex-col gap-4 px-6 text-center">
          <p className="text-[#c9a96e] text-[10px] tracking-[0.4em] uppercase font-bold">Our Promise</p>
          <h2 className="text-2xl md:text-4xl font-black text-[#111] max-w-xl tracking-tight leading-tight">
            Designed to Make You Feel Something
          </h2>
          <Link
            href="/about"
            className="text-[#111] text-[11px] tracking-[0.3em] uppercase font-semibold underline underline-offset-4 hover:text-[#c9a96e] transition-colors"
          >
            Our Story
          </Link>
        </div>
      </section>

      {/* ── POLICY STRIP ─────────────────────────────────────────────────── */}
      <section className="bg-[#111] py-12 px-6 md:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            {
              icon: <Truck size={22} className="text-[#c9a96e]" />,
              title: 'Free Shipping',
              desc: 'On orders above ₹999',
            },
            {
              icon: <RefreshCw size={22} className="text-[#c9a96e]" />,
              title: 'Easy Returns',
              desc: '30-day hassle-free returns',
            },
            {
              icon: <Shield size={22} className="text-[#c9a96e]" />,
              title: 'Secure Payment',
              desc: '100% safe & encrypted',
            },
            {
              icon: <Headphones size={22} className="text-[#c9a96e]" />,
              title: '24/7 Support',
              desc: 'Always here to help',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                {icon}
              </div>
              <div>
                <p className="text-white text-xs font-bold tracking-widest uppercase mb-1">{title}</p>
                <p className="text-white/40 text-[11px] tracking-wide">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── NEWSLETTER ───────────────────────────────────────────────────── */}
      <section className="bg-[#1a1a1a] py-20 md:py-28 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-[#c9a96e] text-[10px] font-bold tracking-[0.4em] uppercase mb-4">
            Exclusive Access
          </p>
          <h2 className="text-white text-3xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
            JOIN THE<br />
            <span className="text-[#c9a96e]">MOONLIGHT</span> CLUB
          </h2>
          <p className="text-white/50 text-sm tracking-wide mb-10">
            Get exclusive offers, new arrivals, and style tips delivered to your inbox.
          </p>

          {subscribed ? (
            <div className="border border-[#c9a96e]/30 bg-[#c9a96e]/5 px-8 py-5">
              <p className="text-[#c9a96e] text-sm font-semibold tracking-wide">
                Welcome to the club! Check your inbox.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-0">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm px-5 py-4 outline-none focus:border-[#c9a96e] transition-colors"
              />
              <button
                type="submit"
                className="bg-[#c9a96e] text-[#111] text-xs font-bold tracking-[0.2em] uppercase px-8 py-4 hover:bg-[#b8955a] transition-colors duration-200 whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          )}

          <p className="text-white/20 text-[11px] tracking-wide mt-5">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>

    </main>
  );
}
