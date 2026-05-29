import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send refresh_token cookie automatically
  headers: { 'Content-Type': 'application/json' },
});

// ─── In-memory token store ────────────────────────────────────────────────────
// Access token never touches localStorage or cookies — lives in module closure
// Invisible to XSS attacks

let accessToken: string | null = null;
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ─── Request interceptor — attach access token ────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ─── Response interceptor — silent token refresh ─────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Never retry auth endpoints — avoids infinite loop when refresh itself fails
    if (originalRequest.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue request while a refresh is already in-flight
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<{ data: { accessToken: string } }>(
        `${API_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const newToken = data.data.accessToken;
      setAccessToken(newToken);

      refreshQueue.forEach(({ resolve }) => resolve(newToken));
      refreshQueue = [];

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      refreshQueue.forEach(({ reject }) => reject(refreshError));
      refreshQueue = [];
      setAccessToken(null);
      // Redirect to login only if not already on an auth page
      if (typeof window !== 'undefined') {
        const onAuthPage = ['/login', '/register'].some((p) =>
          window.location.pathname.startsWith(p),
        );
        if (!onAuthPage) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
