import apiClient from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ForgotPasswordResponse {
  message: string;
  resetUrl?: string; // only returned in development
}

export const authApi = {
  register: async (data: { name: string; email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<{ data: AuthResponse }>('/auth/register', data);
    return res.data.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<{ data: AuthResponse }>('/auth/login', data);
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refresh: async (): Promise<{ accessToken: string }> => {
    const res = await apiClient.post<{ data: { accessToken: string } }>('/auth/refresh');
    return res.data.data;
  },

  me: async (): Promise<User> => {
    const res = await apiClient.get<{ data: User }>('/auth/me');
    return res.data.data;
  },

  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    const res = await apiClient.post<{ data: ForgotPasswordResponse }>('/auth/forgot-password', { email });
    return res.data.data;
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const res = await apiClient.post<{ data: { message: string } }>('/auth/reset-password', { token, password });
    return res.data.data;
  },
};
