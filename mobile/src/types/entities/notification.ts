export type NotificationType =
  | 'message'
  | 'friend_request'
  | 'mention'
  | 'reply'
  | 'reaction'
  | 'system';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  relatedConversation?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}
