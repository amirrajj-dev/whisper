import { api } from '@/libs/axios';

export interface RegisterDeviceDto {
  token: string;
  platform: 'ios' | 'android';
  deviceName?: string;
}

export interface DeviceInfo {
  id: string;
  platform: string;
  deviceName?: string;
  lastUsedAt: string;
  createdAt: string;
}

export const pushApi = {
  registerToken: (data: RegisterDeviceDto) =>
    api.post<{ message: string }>('/push/register', data).then((r) => r.data),

  unregisterToken: (token: string) =>
    api.post<{ message: string }>('/push/unregister', { token }).then((r) => r.data),

  unregisterAllTokens: () =>
    api.delete<{ message: string }>('/push/unregister-all').then((r) => r.data),

  getDevices: () =>
    api.get<DeviceInfo[]>('/push/devices').then((r) => r.data),
};
