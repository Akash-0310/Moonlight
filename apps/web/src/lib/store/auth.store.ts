'use client';

import { create } from 'zustand';
import { authApi, type User } from '../api/auth';
import { setAccessToken } from '../api/client';
import { useWishlistStore } from './wishlist.store';
import { useCartStore } from './cart.store';
import { setSessionCookie, clearSessionCookie } from '../sessionCookie';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const { accessToken } = await authApi.refresh();
      setAccessToken(accessToken);
      const user = await authApi.me();
      set({ user, isAuthenticated: true });
      setSessionCookie();
    } catch {
      setAccessToken(null);
      set({ user: null, isAuthenticated: false });
      clearSessionCookie();
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    setAccessToken(result.accessToken);
    set({ user: result.user, isAuthenticated: true });
    setSessionCookie();
  },

  register: async (name: string, email: string, password: string) => {
    const result = await authApi.register({ name, email, password });
    setAccessToken(result.accessToken);
    set({ user: result.user, isAuthenticated: true });
    setSessionCookie();
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      set({ user: null, isAuthenticated: false });
      clearSessionCookie();
      useWishlistStore.getState().clear();
      useCartStore.getState().clearCart();
    }
  },
}));
