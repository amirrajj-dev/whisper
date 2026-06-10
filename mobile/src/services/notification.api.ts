import { api } from '@/libs/axios';
import type { NotificationListResponse, UnreadCountResponse } from '@/types/api/responses';
import type { Notification } from '@/types/entities/notification';
import type { PaginationDto } from '@/types/dto/pagination';

export const notificationApi = {
  getNotifications: (params?: PaginationDto) =>
    api.get<NotificationListResponse>('/notification', { params }).then((r) => r.data),

  getUnreadCount: () =>
    api.get<UnreadCountResponse>('/notification/unread-count').then((r) => r.data),

  markAsRead: (id: string) =>
    api.patch<Notification>(`/notification/${id}/read`).then((r) => r.data),

  markAllAsRead: () =>
    api.patch<{ message: string }>('/notification/read-all').then((r) => r.data),

  deleteAll: () =>
    api.delete<{ message: string }>('/notification/all').then((r) => r.data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/notification/${id}`).then((r) => r.data),
};
