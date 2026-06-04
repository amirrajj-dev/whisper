import type { Conversation } from '../entities/conversation';
import type { Message } from '../entities/message';
import type { Notification } from '../entities/notification';
import type { User } from '../entities/user';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface PaginatedResponse<_T> {
  total: number;
  page: number;
  totalPages: number;
}

export interface ConversationListResponse extends PaginatedResponse<Conversation> {
  conversations: Conversation[];
}

export interface MessageListResponse extends PaginatedResponse<Message> {
  messages: Message[];
}

export interface NotificationListResponse extends PaginatedResponse<Notification> {
  notifications: Notification[];
}

export interface UserListResponse extends PaginatedResponse<User> {
  users: User[];
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface OnlineStatusResponse {
  userId: string;
  online: boolean;
}

export interface BatchOnlineStatusResponse {
  status: Record<string, boolean>;
}

export interface SocketStatsResponse {
  onlineUsers: number;
  activeSockets: number;
}

export interface MessageResponse {
  message: string;
}
