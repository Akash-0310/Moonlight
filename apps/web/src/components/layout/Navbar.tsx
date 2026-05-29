'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, Heart, User, Menu, X, ChevronDown, ArrowRight, Moon } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { useCartStore } from '@/lib/store/cart.store';
import { useWishlistStore } from '@/lib/store/wishlist.store';
import { useState, useEffect, useRef } from 'react'; // useRef kept for userMenuRef
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Collection' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, isAuthenticated, logout } = useAuthStore();
  const { getItemCount } = useCartStore();
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === '/';
  const itemCount = getItemCount();

  // Track scroll to toggle transparency on homepage
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    router.push('/');
  };

  const isTransparent = isHome && !scrolled && !mobileOpen;

  return (
    <>
      {/* Main navbar */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isTransparent
            ? 'bg-transparent border-b border-white/10'
            : 'bg-white border-b border-gray-100 shadow-sm'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">

            {/* Logo */}
            <Link
              href="/"
              className={cn(
                'flex items-center gap-2 flex-shrink-0 transition-colors',
                isTransparent ? 'text-white' : 'text-gray-900'
              )}
            >
              <Moon
                size={18}
                strokeWidth={1.5}
                className={cn(
                  'transition-colors',
                  isTransparent ? 'text-white/80' : 'text-gray-900'
                )}
              />
              <span className="text-sm font-semibold tracking-[0.25em] uppercase select-none">
                Moon Light
              </span>
            </Link>

            {/* Center nav links — desktop */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'text-xs font-medium tracking-wider uppercase transition-colors relative group',
                    isTransparent
                      ? pathname === href
                        ? 'text-white'
                        : 'text-white/70 hover:text-white'
                      : pathname === href
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      'absolute -bottom-1 left-0 h-px bg-current transition-all duration-200',
                      pathname === href ? 'w-full' : 'w-0 group-hover:w-full'
                    )}
                  />
                </Link>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-1">

              {/* Wishlist */}
              <Link
                href="/wishlist"
                aria-label={`Wishlist (${wishlistCount} items)`}
                className={cn(
                  'relative p-2 rounded-full transition-colors',
                  isTransparent
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <Heart size={18} strokeWidth={1.5} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] flex items-center justify-center text-[9px] font-bold bg-gray-900 text-white rounded-full px-[3px] leading-none">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                aria-label={`Cart (${itemCount} items)`}
                className={cn(
                  'relative p-2 rounded-full transition-colors',
                  isTransparent
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <ShoppingBag size={18} strokeWidth={1.5} />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] flex items-center justify-center text-[9px] font-bold bg-gray-900 text-white rounded-full px-[3px] leading-none">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {/* User menu — desktop */}
              <div ref={userMenuRef} className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label="User menu"
                  className={cn(
                    'flex items-center gap-1 p-2 rounded-full transition-colors',
                    isTransparent
                      ? 'text-white/80 hover:text-white hover:bg-white/10'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <User size={18} strokeWidth={1.5} />
                  <ChevronDown
                    size={12}
                    strokeWidth={2}
                    className={cn('transition-transform duration-200', userMenuOpen ? 'rotate-180' : '')}
                  />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 bg-[#111] z-50 shadow-2xl">
                    {isAuthenticated && user ? (
                      <>
                        {/* User header */}
                        <div className="px-5 py-4 border-b border-white/10">
                          <p className="text-[9px] tracking-[0.25em] uppercase text-white/40 mb-1">Signed in as</p>
                          <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                        </div>

                        <Link
                          href="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-5 py-3.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/60 hover:text-white hover:bg-white/5 transition-colors border-b border-white/10 group"
                        >
                          My Orders
                          <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                        </Link>

                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-5 py-3.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/60 hover:text-white hover:bg-white/5 transition-colors border-b border-white/10 group"
                        >
                          Profile
                          <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-between px-5 py-3.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/40 hover:text-white hover:bg-white/5 transition-colors group"
                        >
                          Logout
                          <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Brand label */}
                        <div className="px-5 py-3.5 border-b border-white/10">
                          <p className="text-[9px] tracking-[0.3em] uppercase text-white/30">Moon Light</p>
                        </div>

                        <Link
                          href="/login"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-5 py-4 text-[11px] font-semibold tracking-[0.18em] uppercase text-white hover:bg-white hover:text-[#111] transition-colors border-b border-white/10 group"
                        >
                          Login
                          <ArrowRight size={11} strokeWidth={2} />
                        </Link>

                        <Link
                          href="/register"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-5 py-4 text-[11px] font-semibold tracking-[0.18em] uppercase text-white hover:bg-white hover:text-[#111] transition-colors group"
                        >
                          Register
                          <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
                className={cn(
                  'md:hidden p-2 rounded-full transition-colors',
                  isTransparent
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                {mobileOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>

      </header>

      {/* Mobile drawer */}
      <>
        {/* Backdrop */}
        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300',
            mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer panel */}
        <div
          className={cn(
            'fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-2xl md:hidden flex flex-col transition-transform duration-300 ease-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <Link href="/" className="flex items-center gap-2 text-gray-900" onClick={() => setMobileOpen(false)}>
              <Moon size={17} strokeWidth={1.5} className="text-gray-900" />
              <span className="text-sm font-semibold tracking-[0.25em] uppercase">Moon Light</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-5 py-6 space-y-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-3 py-2.5 text-sm font-medium tracking-wider uppercase rounded-lg transition-colors',
                  pathname === href
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile auth links */}
          <div className="px-5 pb-8 pt-4 border-t border-gray-100 space-y-1">
            {isAuthenticated && user ? (
              <>
                <p className="px-3 py-1 text-xs text-gray-400 tracking-wider uppercase font-medium">{user.name}</p>
                <Link
                  href="/orders"
                  className="block px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  My Orders
                </Link>
                <Link
                  href="/profile"
                  className="block px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </>
    </>
  );
}
