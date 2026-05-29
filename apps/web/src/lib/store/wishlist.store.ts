'use client';

import { create } from 'zustand';
import { wishlistApi, type WishlistItem } from '../api/wishlist';

interface WishlistStore {
  items: WishlistItem[];
  isLoading: boolean;

  fetchWishlist: () => Promise<void>;
  toggleItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  isLoading: false,

  fetchWishlist: async () => {
    set({ isLoading: true });
    try {
      const items = await wishlistApi.get();
      set({ items });
    } catch {
      set({ items: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleItem: async (productId: string) => {
    try {
      const items = await wishlistApi.toggle(productId);
      set({ items });
    } catch {
      // silently fail — UI already reflects optimistic state
    }
  },

  removeItem: async (productId: string) => {
    try {
      const items = await wishlistApi.remove(productId);
      set({ items });
    } catch {
      // re-fetch on error
      get().fetchWishlist();
    }
  },

  isWishlisted: (productId: string) =>
    get().items.some((i) => i.productId === productId),

  clear: () => set({ items: [] }),
}));
