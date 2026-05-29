'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { productsApi, type Product } from '@/lib/api/products';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['Men', 'Women', 'Kids'];
const SUB_CATEGORIES = ['Topwear', 'Bottomwear', 'Winterwear'];
const SORT_OPTIONS = [
  { label: 'Relevant', value: 'relevant' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Newest', value: 'newest' },
  { label: 'Top Rated', value: 'top_rated' },
];

const PAGE_SIZE = 12;
const MAX_PRICE = 10000;

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-[#f2f2f2] mb-4 relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>
      <div className="h-2 bg-[#f2f2f2] w-1/4 mb-2.5 rounded-sm" />
      <div className="h-3 bg-[#f2f2f2] w-3/4 mb-2 rounded-sm" />
      <div className="h-3 bg-[#f2f2f2] w-1/3 rounded-sm" />
    </div>
  );
}

// ─── Sidebar Filters ──────────────────────────────────────────────────────────

interface FiltersProps {
  selectedCategories: string[];
  selectedSubCategories: string[];
  appliedMaxPrice: number;
  onCategoryChange: (cat: string) => void;
  onSubCategoryChange: (sub: string) => void;
  onPriceApply: (max: number) => void;
  onClear: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

function FilterPanel({
  selectedCategories,
  selectedSubCategories,
  appliedMaxPrice,
  onCategoryChange,
  onSubCategoryChange,
  onPriceApply,
  onClear,
  isMobile,
  onClose,
}: FiltersProps) {
  const [pendingMax, setPendingMax] = useState(
    appliedMaxPrice < MAX_PRICE ? appliedMaxPrice : 500
  );

  // Sync slider when filter is cleared externally
  useEffect(() => {
    setPendingMax(appliedMaxPrice < MAX_PRICE ? appliedMaxPrice : 500);
  }, [appliedMaxPrice]);

  const fillPercent = (pendingMax / MAX_PRICE) * 100;
  const hasFilters =
    selectedCategories.length > 0 ||
    selectedSubCategories.length > 0 ||
    appliedMaxPrice < MAX_PRICE;

  return (
    <div className={isMobile ? 'p-6' : 'sticky top-24'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-black tracking-[0.25em] uppercase text-[#111]">Filters</h2>
        <div className="flex items-center gap-3">
          {hasFilters && (
            <button
              onClick={() => { setPendingMax(500); onClear(); }}
              className="text-[10px] tracking-widest uppercase text-[#888] hover:text-[#111] transition-colors font-semibold"
            >
              Clear all
            </button>
          )}
          {isMobile && onClose && (
            <button onClick={onClose} className="text-[#111]">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── Price Range ─────────────────────────────────────── */}
      <div className="mb-8">
        <h3 className="text-[10px] font-black tracking-[0.25em] uppercase text-[#111] mb-4 pb-2 border-b border-[#eee]">
          Price Range
        </h3>

        {/* Min / Max labels */}
        <div className="flex items-center justify-between text-xs text-[#888] mb-3">
          <span>₹0</span>
          <span className="font-semibold text-[#111]">
            ₹{pendingMax.toLocaleString('en-IN')}{pendingMax === MAX_PRICE ? '+' : ''}
          </span>
        </div>

        {/* Slider track */}
        <style>{`
          .price-slider-thumb::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #ffffff;
            border: 2px solid #111111;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          }
          .price-slider-thumb::-moz-range-thumb {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #ffffff;
            border: 2px solid #111111;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          }
        `}</style>
        <div className="relative h-5 flex items-center mb-4">
          {/* Grey track */}
          <div className="absolute inset-x-0 h-[3px] bg-[#e5e5e5] rounded-full" />
          {/* Filled portion (₹0 → thumb) */}
          <div
            className="absolute left-0 h-[3px] bg-[#111] rounded-full pointer-events-none"
            style={{ width: `${fillPercent}%` }}
          />
          {/* Fixed left circle at ₹0 */}
          <div className="absolute left-0 -translate-x-1/2 w-[14px] h-[14px] rounded-full bg-white border-2 border-[#111111] shadow-sm z-10 pointer-events-none" style={{ border: '2px solid #111111' }} />
          {/* Range input — drives the right thumb */}
          <input
            type="range"
            min={0}
            max={MAX_PRICE}
            step={100}
            value={pendingMax}
            onChange={(e) => setPendingMax(Number(e.target.value))}
            className="price-slider-thumb absolute inset-x-0 h-[3px] appearance-none bg-transparent cursor-pointer z-20"
          />
        </div>

        {/* Apply button */}
        <button
          onClick={() => onPriceApply(pendingMax)}
          className="w-full py-2 bg-[#111] text-white text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-[#333] transition-colors duration-200"
        >
          Apply
        </button>
      </div>

      {/* ── Category ────────────────────────────────────────── */}
      <div className="mb-8">
        <h3 className="text-[10px] font-black tracking-[0.25em] uppercase text-[#111] mb-4 pb-2 border-b border-[#eee]">
          Category
        </h3>
        <div className="flex flex-col gap-3">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => onCategoryChange(cat)}
                className="w-4 h-4 border-2 border-[#ddd] accent-[#111] cursor-pointer"
              />
              <span className="text-sm text-[#444] group-hover:text-[#111] transition-colors">
                {cat}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Sub-Category ────────────────────────────────────── */}
      <div className="mb-8">
        <h3 className="text-[10px] font-black tracking-[0.25em] uppercase text-[#111] mb-4 pb-2 border-b border-[#eee]">
          Sub-Category
        </h3>
        <div className="flex flex-col gap-3">
          {SUB_CATEGORIES.map((sub) => (
            <label key={sub} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedSubCategories.includes(sub)}
                onChange={() => onSubCategoryChange(sub)}
                className="w-4 h-4 border-2 border-[#ddd] accent-[#111] cursor-pointer"
              />
              <span className="text-sm text-[#444] group-hover:text-[#111] transition-colors">
                {sub}
              </span>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── Main Collection Page ─────────────────────────────────────────────────────

export default function CollectionPage() {
  return (
    <Suspense>
      <CollectionContent />
    </Suspense>
  );
}

function CollectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── State ──────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Read from URL
  const pageFromUrl = Number(searchParams.get('page') ?? '1');
  const sortFromUrl = searchParams.get('sort') ?? 'relevant';
  const searchFromUrl = searchParams.get('search') ?? '';
  const categoriesFromUrl = searchParams.getAll('category');
  const subCategoriesFromUrl = searchParams.getAll('subCategory');

  const [page, setPage] = useState(pageFromUrl);
  const [sort, setSort] = useState(sortFromUrl);
  const [search, setSearch] = useState(searchFromUrl);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categoriesFromUrl);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(subCategoriesFromUrl);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(MAX_PRICE);

  // ── URL sync ───────────────────────────────────────────────────────────────
  const updateUrl = useCallback(
    (overrides: Record<string, string | number | string[]> = {}) => {
      const params = new URLSearchParams();

      const currentPage = (overrides.page as number) ?? page;
      const currentSort = (overrides.sort as string) ?? sort;
      const currentSearch = (overrides.search as string) ?? search;
      const currentCategories = (overrides.categories as string[]) ?? selectedCategories;
      const currentSubCategories = (overrides.subCategories as string[]) ?? selectedSubCategories;

      if (currentPage > 1) params.set('page', String(currentPage));
      if (currentSort !== 'relevant') params.set('sort', currentSort);
      if (currentSearch) params.set('search', currentSearch);
      currentCategories.forEach((c) => params.append('category', c));
      currentSubCategories.forEach((s) => params.append('subCategory', s));

      router.push(`/collection?${params.toString()}`, { scroll: false });
    },
    [page, sort, search, selectedCategories, selectedSubCategories, router]
  );

  // ── Fetch products ─────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        page,
        limit: PAGE_SIZE,
      };

      if (sort === 'top_rated') params.sort = 'rating';
      else if (sort !== 'relevant') params.sort = sort;

      if (search) params.search = search;
      if (selectedCategories.length > 0) params.category = selectedCategories.join(',');
      if (selectedSubCategories.length > 0) params.subCategory = selectedSubCategories.join(',');

      const data = await productsApi.list(params);
      const items = (data.items ?? []).filter(
        (p) => appliedMaxPrice >= MAX_PRICE || parseFloat(p.price) <= appliedMaxPrice
      );
      setProducts(items);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setProducts([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, sort, search, selectedCategories, selectedSubCategories, appliedMaxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCategoryChange = (cat: string) => {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    setSelectedCategories(next);
    setPage(1);
    updateUrl({ categories: next, page: 1 });
  };

  const handleSubCategoryChange = (sub: string) => {
    const next = selectedSubCategories.includes(sub)
      ? selectedSubCategories.filter((s) => s !== sub)
      : [...selectedSubCategories, sub];
    setSelectedSubCategories(next);
    setPage(1);
    updateUrl({ subCategories: next, page: 1 });
  };

  const handlePriceApply = (max: number) => {
    setAppliedMaxPrice(max);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setAppliedMaxPrice(MAX_PRICE);
    setPage(1);
    updateUrl({ categories: [], subCategories: [], page: 1 });
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(1);
    updateUrl({ sort: value, page: 1 });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateUrl({ search, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Pagination numbers ─────────────────────────────────────────────────────
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  const activeFilterCount =
    selectedCategories.length +
    selectedSubCategories.length +
    (appliedMaxPrice < MAX_PRICE ? 1 : 0);

  return (
    <div className="bg-white min-h-screen text-[#111]">

      {/* ── Hero — same style as About page ─────────────────────────────── */}
      <section className="relative h-[70vh] min-h-[480px] flex items-end overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80"
          alt="MoonLight Collection"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-16 md:px-12 lg:px-16">
          <p className="text-xs tracking-[0.35em] text-white/60 mb-3 uppercase">Moon Light / Browse</p>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight text-white leading-none">
            Collection
          </h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-10">
        <div className="flex gap-10 lg:gap-16">

          {/* ── Sidebar (desktop) ─────────────────────────────────────────── */}
          <aside className="hidden lg:block w-52 shrink-0">
            <FilterPanel
              selectedCategories={selectedCategories}
              selectedSubCategories={selectedSubCategories}
              appliedMaxPrice={appliedMaxPrice}
              onCategoryChange={handleCategoryChange}
              onSubCategoryChange={handleSubCategoryChange}
              onPriceApply={handlePriceApply}
              onClear={handleClearFilters}
            />
          </aside>

          {/* ── Main ──────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between mb-8 pb-6 border-b border-[#eee]">

              {/* Left: mobile filter btn + search */}
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden relative flex items-center gap-2 bg-[#111] text-white px-4 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-[#333] transition-colors shrink-0"
                >
                  <SlidersHorizontal size={13} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#c9a96e] text-[#111] text-[9px] font-black rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs">
                  <Search size={13} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#999]" />
                  <input
                    type="text"
                    placeholder="Search pieces…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-6 pr-3 py-2 border-b border-[#ddd] text-sm outline-none focus:border-[#111] transition-colors bg-transparent placeholder:text-[#bbb]"
                  />
                </form>
              </div>

              {/* Right: count + sort */}
              <div className="flex items-center gap-5 shrink-0">
                {!loading && (
                  <p className="text-[11px] text-[#999] hidden sm:block tracking-wide">
                    <span className="font-bold text-[#111]">
                      {Math.min((page - 1) * PAGE_SIZE + products.length, total)}
                    </span>
                    {' '}of{' '}
                    <span className="font-bold text-[#111]">{total}</span>
                  </p>
                )}

                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="appearance-none border-b border-[#ddd] text-[11px] font-bold tracking-[0.15em] uppercase pl-0 pr-6 py-2 outline-none focus:border-[#111] bg-transparent cursor-pointer text-[#111]"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight size={11} className="absolute right-0 top-1/2 -translate-y-1/2 rotate-90 text-[#999] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-7">
                <span className="text-[9px] tracking-[0.3em] uppercase text-[#999] mr-1">Active:</span>
                {[...selectedCategories, ...selectedSubCategories].map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      CATEGORIES.includes(tag)
                        ? handleCategoryChange(tag)
                        : handleSubCategoryChange(tag)
                    }
                    className="inline-flex items-center gap-1.5 border border-[#111] text-[#111] text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 hover:bg-[#111] hover:text-white transition-colors group"
                  >
                    {tag}
                    <X size={9} className="group-hover:rotate-90 transition-transform duration-200" />
                  </button>
                ))}
                {appliedMaxPrice < MAX_PRICE && (
                  <button
                    onClick={() => handlePriceApply(MAX_PRICE)}
                    className="inline-flex items-center gap-1.5 border border-[#111] text-[#111] text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 hover:bg-[#111] hover:text-white transition-colors group"
                  >
                    ≤ ₹{appliedMaxPrice.toLocaleString('en-IN')}
                    <X size={9} className="group-hover:rotate-90 transition-transform duration-200" />
                  </button>
                )}
                <button
                  onClick={handleClearFilters}
                  className="text-[9px] tracking-[0.25em] uppercase text-[#bbb] hover:text-[#111] transition-colors font-semibold ml-1"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Product grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-20 h-px bg-[#111] mb-8 mx-auto" />
                <p className="text-[10px] tracking-[0.4em] uppercase text-[#bbb] mb-3">No results</p>
                <h3 className="text-2xl font-black text-[#111] mb-2 tracking-tight">Nothing found</h3>
                <p className="text-sm text-[#999] mb-10 max-w-xs">
                  Try adjusting your filters or searching for something different.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="bg-[#111] text-white text-[10px] font-bold tracking-[0.25em] uppercase px-10 py-3.5 hover:bg-[#333] transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Mobile product count */}
            {!loading && products.length > 0 && (
              <p className="sm:hidden text-[11px] text-[#999] mt-6 text-center tracking-wide">
                {Math.min((page - 1) * PAGE_SIZE + products.length, total)} of {total} products
              </p>
            )}

            {/* Pagination */}
            {totalPages > 1 && !loading && (
              <div className="flex items-center justify-center gap-1 mt-16 pt-8 border-t border-[#eee]">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="w-10 h-10 flex items-center justify-center border border-[#ddd] text-[#999] hover:border-[#111] hover:text-[#111] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={15} strokeWidth={1.5} />
                </button>

                {getPageNumbers().map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} className="w-10 h-10 flex items-center justify-center text-[#ccc] text-sm tracking-widest">
                      ···
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p as number)}
                      className={`w-10 h-10 flex items-center justify-center text-xs font-bold tracking-widest transition-all ${
                        p === page
                          ? 'bg-[#111] text-white'
                          : 'border border-[#ddd] text-[#999] hover:border-[#111] hover:text-[#111]'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="w-10 h-10 flex items-center justify-center border border-[#ddd] text-[#999] hover:border-[#111] hover:text-[#111] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={15} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ───────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer — dark theme matching the site */}
          <div className="fixed inset-y-0 left-0 w-72 bg-[#111] z-50 lg:hidden overflow-y-auto shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div>
                <p className="text-[9px] tracking-[0.35em] uppercase text-white/40 mb-0.5">Moon Light</p>
                <p className="text-sm font-bold tracking-widest uppercase text-white">Filters</p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            {/* Inject light-theme styles for FilterPanel inside dark drawer */}
            <div className="[&_h3]:text-white/50 [&_h2]:text-white [&_span]:text-white/70 [&_label]:text-white/70 [&_.price-slider-thumb]:invert">
            <FilterPanel
              selectedCategories={selectedCategories}
              selectedSubCategories={selectedSubCategories}
              appliedMaxPrice={appliedMaxPrice}
              onCategoryChange={handleCategoryChange}
              onSubCategoryChange={handleSubCategoryChange}
              onPriceApply={handlePriceApply}
              onClear={handleClearFilters}
              isMobile
              onClose={() => setDrawerOpen(false)}
            />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
