'use client';

import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '@/src/hooks/use-notifications';
import { NotificationItem } from './notification-item';
import { ChevronLeft, Bell, CheckCheck, Loader2, Inbox } from 'lucide-react';

interface NotificationsViewProps {
  onBack?: () => void;
}

export function NotificationsView({ onBack }: NotificationsViewProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.pages.flatMap((p) => p.notifications) ?? [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="btn btn-ghost btn-sm btn-square lg:hidden">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <Bell className="w-5 h-5" />
          <h2 className="font-semibold">Notifications</h2>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            className="btn btn-ghost btn-xs gap-1"
            title="Mark all as read"
          >
            {markAllAsRead.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Mark all read</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-base-content/40" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-base-content/40" />
            </div>
            <h3 className="text-lg font-semibold">All caught up!</h3>
            <p className="text-sm text-base-content/60 mt-1 max-w-sm">
              You have no unread notifications. New messages and activity will appear here.
            </p>
          </div>
        ) : (
          <>
            {notifications.map((n) => (
              <NotificationItem
                key={n._id}
                notification={n}
                onMarkAsRead={(id) => !n.isRead && markAsRead.mutate(id)}
                onDelete={(id) => deleteNotification.mutate(id)}
              />
            ))}
            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full py-3 text-xs text-primary hover:bg-base-200 transition-colors"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                ) : (
                  'Load more'
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
