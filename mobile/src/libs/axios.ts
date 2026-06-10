import axios, { AxiosError } from 'axios';
import { secureStorage } from './secure-storage';
import { appEvents } from './event-emitter';
import { API_URL } from '@/constants';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(undefined);
    }
  });
  failedQueue = [];
};

const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/refresh'];

const isAuthRoute = (url?: string) =>
  AUTH_ROUTES.some((route) => url?.includes(route));

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  if (isAuthRoute(config.url)) return config;
  const token = await secureStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute(originalRequest.url)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await secureStorage.getRefreshToken();
        const res = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          refreshToken ? { refresh_token: refreshToken } : {},
          { headers: { 'Content-Type': 'application/json' } },
        );

        const data = res.data as { access_token: string; refresh_token: string };
        await secureStorage.setAccessToken(data.access_token);
        await secureStorage.setRefreshToken(data.refresh_token);

        processQueue(null);

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        await secureStorage.clearTokens();
        appEvents.emit('auth:logout');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const normalizedError = {
      message:
        (error.response?.data as { message?: string })?.message ||
        error.message ||
        'Something went wrong',
      statusCode: error.response?.status || 500,
    };

    return Promise.reject(normalizedError);
  },
);
