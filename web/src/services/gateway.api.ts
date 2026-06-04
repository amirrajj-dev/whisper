import { api } from '@/src/libs/axios';
import type { OnlineStatusResponse, BatchOnlineStatusResponse, SocketStatsResponse } from '@/src/types/api/responses';

export const gatewayApi = {
  checkOnline: (userId: string) =>
    api.get<OnlineStatusResponse>(`/gateway/online/${userId}`).then((r) => r.data),

  checkOnlineBatch: (userIds: string[]) =>
    api.post<BatchOnlineStatusResponse>('/gateway/online/batch', { userIds }).then((r) => r.data),

  getStats: () =>
    api.get<SocketStatsResponse>('/gateway/stats').then((r) => r.data),
};
