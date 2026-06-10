import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/services/notification.api';
import { useNotificationStore } from '@/stores/notification.store';
import { useEffect } from 'react';

const NOTIFICATIONS_PER_PAGE = 20;

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam = 1 }) =>
      notificationApi.getNotifications({ page: pageParam, limit: NOTIFICATIONS_PER_PAGE }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30 * 1000,
  });
}

export function useUnreadCount() {
  const { setUnreadCount } = useNotificationStore();

  const query = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationApi.getUnreadCount(),
    staleTime: 60 * 1000,
    refetchInterval: false,
  });

  useEffect(() => {
    if (query.data) {
      setUnreadCount(query.data.count);
    }
  }, [query.data, setUnreadCount]);

  return query;
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { decrementUnread } = useNotificationStore();

  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      decrementUnread();
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { resetUnread } = useNotificationStore();

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      resetUnread();
    },
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  const { resetUnread } = useNotificationStore();

  return useMutation({
    mutationFn: () => notificationApi.deleteAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      resetUnread();
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}
