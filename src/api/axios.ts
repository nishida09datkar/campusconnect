import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './config';
import { ApiError } from '@/types';

const TOKEN_STORAGE_KEY = 'campusconnect_auth_token';

// In-memory token cache backed by browser storage for session restoration
let inMemoryToken: string | null = null;

export const getAccessToken = (): string | null => {
  if (inMemoryToken) {
    return inMemoryToken;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        inMemoryToken = stored;
        return stored;
      }
    } catch {
      // Storage access may fail in private browsing mode
    }
  }
  return null;
};

export const setAccessToken = (token: string | null): void => {
  inMemoryToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // Storage access may fail in private browsing mode
    }
  }
};

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
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
      setAccessToken(null);
    }

    return Promise.reject(apiError);
  }
);

export default apiClient;
