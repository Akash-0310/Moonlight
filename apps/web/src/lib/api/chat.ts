import apiClient from './client';

export interface ChatProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  image: string;
  category: string;
  subCategory: string;
  isBestseller: boolean;
  variants: { id: string; size: string; stock: number }[];
}

export interface ChatRequest {
  message: string;
  sessionId: string;
}

export interface ChatResponse {
  reply: string;
  products?: ChatProduct[];
  sessionId: string;
}

export const chatApi = {
  send: async (payload: ChatRequest): Promise<ChatResponse> => {
    const res = await apiClient.post<{ data: ChatResponse }>('/ai-assistant/chat', payload);
    return res.data.data;
  },
};
