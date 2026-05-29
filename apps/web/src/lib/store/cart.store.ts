'use client';

import { create } from 'zustand';
import { cartApi, type CartItem } from '../api/cart';

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, variantId: string, quantity?: number) => Promise<void>;
  updateItem: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const cart = await cartApi.get();
      set({ items: cart.items });
    } catch {
      set({ items: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (productId: string, variantId: string, quantity = 1) => {
    set({ isLoading: true });
    try {
      const cart = await cartApi.add(productId, variantId, quantity);
      set({ items: cart.items });
    } finally {
      set({ isLoading: false });
    }
  },

  updateItem: async (cartItemId: string, quantity: number) => {
    set({ isLoading: true });
    try {
      const cart = await cartApi.update(cartItemId, quantity);
      set({ items: cart.items });
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (cartItemId: string) => {
    set({ isLoading: true });
    try {
      const cart = await cartApi.removeItem(cartItemId);
      set({ items: cart.items });
    } finally {
      set({ isLoading: false });
    }
  },

  clearCart: () => set({ items: [] }),

  getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

  getSubtotal: () =>
    get().items.reduce(
      (sum, item) => sum + item.quantity * parseFloat(item.product.price),
      0,
    ),
}));
