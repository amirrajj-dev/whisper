'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '@/src/hooks/use-notifications';
import { NotificationItem } from './notification-item';
import { Bell, CheckCheck, Loader2, Inbox } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.pages.flatMap((p) => p.notifications) ?? [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-base-100 border-l border-base-300 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-base-300">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <h2 className="font-semibold">Notifications</h2>
              </div>
              <button
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                className="btn btn-ghost btn-xs gap-1"
                title="Mark all as read"
              >
                {markAllAsRead.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCheck className="w-3 h-3" />
                )}
                Mark all read
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-base-content/40" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-base-200 flex items-center justify-center mb-3">
                    <Inbox className="w-6 h-6 text-base-content/40" />
                  </div>
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs text-base-content/40 mt-1">No new notifications</p>
                </div>
              ) : (
                <>
                  {notifications.map((n) => (
                    <NotificationItem
                      key={n._id}
                      notification={n}
                      onMarkAsRead={(id) => markAsRead.mutate(id)}
                      onDelete={(id) => deleteNotification.mutate(id)}
                    />
                  ))}
                  {hasNextPage && (
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="w-full py-2 text-xs text-primary hover:bg-base-200"
                    >
                      {isFetchingNextPage ? 'Loading...' : 'Load more'}
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
