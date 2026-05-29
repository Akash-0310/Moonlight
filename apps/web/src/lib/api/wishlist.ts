import apiClient from './client';

export interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  category: string;
  subCategory: string;
  isBestseller: boolean;
  images: Array<{ url: string; isPrimary: boolean }>;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
  product: WishlistProduct;
}

export const wishlistApi = {
  get: async (): Promise<WishlistItem[]> => {
    const res = await apiClient.get<{ data: WishlistItem[] }>('/wishlist');
    return res.data.data;
  },

  toggle: async (productId: string): Promise<WishlistItem[]> => {
    const res = await apiClient.post<{ data: WishlistItem[] }>(
      `/wishlist/toggle/${productId}`
    );
    return res.data.data;
  },

  remove: async (productId: string): Promise<WishlistItem[]> => {
    const res = await apiClient.delete<{ data: WishlistItem[] }>(
      `/wishlist/${productId}`
    );
    return res.data.data;
  },
};
