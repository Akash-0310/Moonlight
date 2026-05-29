import apiClient from './client';

export interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    images: Array<{ url: string; isPrimary: boolean }>;
  };
  variant: { id: string; size: string; stock: number };
}

export interface Cart {
  id: string;
  items: CartItem[];
}

export const cartApi = {
  get: async (): Promise<Cart> => {
    const res = await apiClient.get<{ data: Cart }>('/cart');
    return res.data.data;
  },

  add: async (productId: string, variantId: string, quantity = 1): Promise<Cart> => {
    const res = await apiClient.post<{ data: Cart }>('/cart/add', {
      productId,
      variantId,
      quantity,
    });
    return res.data.data;
  },

  update: async (cartItemId: string, quantity: number): Promise<Cart> => {
    const res = await apiClient.patch<{ data: Cart }>('/cart/update', {
      cartItemId,
      quantity,
    });
    return res.data.data;
  },

  removeItem: async (cartItemId: string): Promise<Cart> => {
    const res = await apiClient.delete<{ data: Cart }>(`/cart/item/${cartItemId}`);
    return res.data.data;
  },

  clear: async (): Promise<void> => {
    await apiClient.delete('/cart');
  },
};
