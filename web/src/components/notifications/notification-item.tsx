'use client';

import { motion } from 'framer-motion';
import type { Notification } from '@/src/types/entities/notification';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, Trash2, MessageSquare, UserPlus, AtSign, Reply, Smile, Info } from 'lucide-react';
import type { NotificationType } from '@/src/types/entities/notification';

const notificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  message: MessageSquare,
  friend_request: UserPlus,
  mention: AtSign,
  reply: Reply,
  reaction: Smile,
  system: Info,
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const IconComponent = notificationIcons[notification.type] || Bell;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 p-3 transition-colors hover:bg-base-200/50 ${
        !notification.isRead ? 'bg-primary/5' : ''
      }`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
        notification.isRead ? 'bg-base-200' : 'bg-primary/10'
      }`}>
        <IconComponent className={`w-4 h-4 ${notification.isRead ? 'text-base-content/40' : 'text-primary'}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>
          {notification.message}
        </p>
        <p className="text-xs text-base-content/40 mt-0.5">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!notification.isRead && onMarkAsRead && (
          <button
            onClick={() => onMarkAsRead(notification._id)}
            className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-primary"
            title="Mark as read"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(notification._id)}
            className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
