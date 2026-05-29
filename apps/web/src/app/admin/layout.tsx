'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  PlusSquare,
  ShoppingCart,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/add', label: 'Add Product', icon: PlusSquare },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
];

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/add': 'Add Product',
  '/admin/orders': 'Orders',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-[#111] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const pageTitle = Object.entries(PAGE_TITLES).reduce((acc, [path, title]) => {
    if (pathname === path || (path !== '/admin' && pathname.startsWith(path))) {
      return title;
    }
    return acc;
  }, 'Admin');

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      {/* Sidebar */}
      <aside className="w-60 bg-[#111] flex flex-col shrink-0 fixed top-0 left-0 h-full z-40">
        {/* Logo */}
        <div className="px-6 py-7 border-b border-white/10">
          <Link href="/admin" className="block">
            <p className="text-[#c9a96e] text-[10px] font-bold tracking-[0.35em] uppercase mb-0.5">
              Moonlight
            </p>
            <p className="text-white text-xs font-semibold tracking-[0.25em] uppercase">
              Admin Panel
            </p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#c9a96e] text-[#111]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-white/40 text-[10px] tracking-widest uppercase mb-0.5">Signed in as</p>
          <p className="text-white text-xs font-medium truncate">{user.name}</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col ml-60">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <h1 className="text-lg font-bold text-[#111] tracking-tight">{pageTitle}</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-[#555] hover:text-[#111] transition-colors"
          >
            <LogOut size={15} />
            Logout
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
