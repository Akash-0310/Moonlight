'use client';

import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/lib/store/auth.store';
import { useWishlistStore } from '@/lib/store/wishlist.store';
import { useCartStore } from '@/lib/store/cart.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min — don't refetch on every navigation
      gcTime: 10 * 60 * 1000,     // 10 min — keep cached data in memory
      retry: 1,
      refetchOnWindowFocus: false, // don't re-fetch when tab regains focus
    },
  },
});

function AuthInitializer() {
  const initialize = useAuthStore((s) => s.initialize);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  // Once authenticated, load user data
  useEffect(() => {
    if (isAuthenticated) {
      void fetchWishlist();
      void fetchCart();
    }
  }, [isAuthenticated, fetchWishlist, fetchCart]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      {children}
      <Toaster richColors position="top-right" />
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
