import { api } from '@/src/libs/axios';
import type { LoginDto, SignupDto, AuthResponse, RefreshResponse } from '@/src/types/dto/auth';

export const authApi = {
  login: (data: LoginDto) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: SignupDto) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  logout: () =>
    api.post<{ message: string }>('/auth/logout').then((r) => r.data),

  refresh: (refreshToken?: string) =>
    api.post<RefreshResponse>('/auth/refresh', refreshToken ? { refresh_token: refreshToken } : {}).then((r) => r.data),

  me: () =>
    api.get<Omit<import('@/src/types/entities/user').User, 'password'>>('/auth/me').then((r) => r.data),
};
