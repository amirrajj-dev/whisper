export type Notification = {
  _id: string;
  userId: string;
  type: NotificationType;
  relatedConversation?: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type NotificationType =
  | 'message'
  | 'friend_request'
  | 'mention'
  | 'reply'
  | 'reaction'
  | 'system';
