import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './config';
import { ApiError } from '@/types';

// In-memory token storage (Security Section 16: never in localStorage)
let inMemoryToken: string | null = null;

export const setAccessToken = (token: string | null): void => {
  inMemoryToken = token;
};

export const getAccessToken = (): string | null => inMemoryToken;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (inMemoryToken && config.headers) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: normalize errors to ApiError
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; fieldErrors?: Record<string, string> }>) => {
    const apiError: ApiError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      fieldErrors: error.response?.data?.fieldErrors,
    };

    if (apiError.status === 401) {
      // 401 handler: In a real backend, refresh token would be called here.
      // If refresh fails, clear token.
      setAccessToken(null);
    }

    return Promise.reject(apiError);
  }
);

export default apiClient;
