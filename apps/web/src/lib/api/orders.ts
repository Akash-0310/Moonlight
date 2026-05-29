import apiClient from './client';

export interface OrderItem {
  id: string;
  productName: string;
  productImage: string;
  priceAtPurchase: string;
  size: string;
  quantity: number;
}

export interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: string;
  deliveryFee: string;
  total: string;
  createdAt: string;
  items: OrderItem[];
  address?: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
  };
}

export interface PlaceOrderData {
  paymentMethod: 'cod' | 'stripe' | 'razorpay';
  items: Array<{ variantId: string; quantity: number }>;
  address: {
    firstName: string;
    lastName: string;
    email: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
}

export interface PlaceOrderResult {
  order: Order;
  checkoutUrl?: string;
  razorpayOrderId?: string;
  amount?: number;
}

export const ordersApi = {
  place: async (data: PlaceOrderData): Promise<PlaceOrderResult> => {
    const res = await apiClient.post<{ data: PlaceOrderResult }>('/orders', data);
    return res.data.data;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const res = await apiClient.get<{ data: Order[] }>('/orders/my');
    return res.data.data;
  },

  getAll: async (): Promise<Order[]> => {
    const res = await apiClient.get<{ data: Order[] }>('/orders');
    return res.data.data;
  },

  updateStatus: async (id: string, status: string): Promise<Order> => {
    const res = await apiClient.patch<{ data: Order }>(`/orders/${id}/status`, { status });
    return res.data.data;
  },
};
