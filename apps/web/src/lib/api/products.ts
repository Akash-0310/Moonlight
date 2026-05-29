import apiClient from './client';

export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  category: string;
  subCategory: string;
  isBestseller: boolean;
  avgRating: number;
  reviewCount: number;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export const productsApi = {
  list: async (params?: Record<string, string | number | boolean>): Promise<ProductListResponse> => {
    const res = await apiClient.get<{ data: ProductListResponse }>('/products', { params });
    return res.data.data;
  },

  getBySlug: async (slug: string): Promise<Product> => {
    const res = await apiClient.get<{ data: Product }>(`/products/${slug}`);
    return res.data.data;
  },

  getBestsellers: async (): Promise<Product[]> => {
    const res = await apiClient.get<{ data: Product[] }>('/products/bestsellers');
    return res.data.data;
  },

  getLatest: async (): Promise<Product[]> => {
    const res = await apiClient.get<{ data: Product[] }>('/products/latest');
    return res.data.data;
  },

  create: async (data: unknown): Promise<Product> => {
    const res = await apiClient.post<{ data: Product }>('/products', data);
    return res.data.data;
  },

  update: async (id: string, data: unknown): Promise<Product> => {
    const res = await apiClient.patch<{ data: Product }>(`/products/${id}`, data);
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
