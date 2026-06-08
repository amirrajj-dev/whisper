import type { MessageType } from '../entities/message';

export interface ServerToClientEvents {
  'user:online': (data: UserOnlinePayload) => void;
  'user:offline': (data: UserOfflinePayload) => void;
  'user:typing': (data: UserTypingPayload) => void;
  'user:stop_typing': (data: UserStopTypingPayload) => void;
  'message:new': (data: MessageNewPayload) => void;
  'message:edited': (data: MessageEditedPayload) => void;
  'message:deleted': (data: MessageDeletedPayload) => void;
  'message:read': (data: MessageReadPayload) => void;
  'messages:read': (data: MessagesReadPayload) => void;
  'conversation:new': (data: ConversationNewPayload) => void;
  'conversation:updated': (data: ConversationUpdatedPayload) => void;
  'conversation:deleted': (data: ConversationDeletedPayload) => void;
  'conversation:ownership_transferred': (data: OwnershipTransferredPayload) => void;
  'participant:added': (data: ParticipantAddedPayload) => void;
  'participant:removed': (data: ParticipantRemovedPayload) => void;
  'participant:role_changed': (data: ParticipantRoleChangedPayload) => void;
  'notification:new': (data: Record<string, unknown>) => void;
  connected: (data: ConnectedPayload) => void;
}

export interface ClientToServerEvents {
  'join:conversation': (data: { conversationId: string }) => void;
  'leave:conversation': (data: { conversationId: string }) => void;
  'typing:start': (data: { conversationId: string }) => void;
  'typing:stop': (data: { conversationId: string }) => void;
  'message:read': (data: { conversationId: string }) => void;
}

export interface UserOnlinePayload {
  userId: string;
  username: string;
  lastSeen: null;
}

export interface UserOfflinePayload {
  userId: string;
  lastSeen: string;
}

export interface UserTypingPayload {
  userId: string;
  conversationId: string;
}

export interface UserStopTypingPayload {
  userId: string;
  conversationId: string;
}

export interface MessageNewPayload {
  conversationId: string;
  messageId: string;
  senderId: string;
  senderUsername: string;
  type: MessageType;
  content: string;
  participants: string[];
  message: Record<string, unknown>;
}

export interface MessageEditedPayload {
  conversationId: string;
  messageId: string;
  senderId: string;
  content: string;
  message: Record<string, unknown>;
}

export interface MessageDeletedPayload {
  conversationId: string;
  messageId: string;
  deletedBy: string;
}

export interface MessageReadPayload {
  userId: string;
  conversationId: string;
  messageId: string;
  readAt: string;
}

export interface MessagesReadPayload {
  userId: string;
  conversationId: string;
  readAt: string;
}

export interface ConversationNewPayload {
  conversationId: string;
  participants: string[];
  conversation: Record<string, unknown>;
}

export interface ConversationUpdatedPayload {
  conversationId: string;
  updatedBy: string;
}

export interface ConversationDeletedPayload {
  conversationId: string;
  deletedBy: string;
}

export interface OwnershipTransferredPayload {
  conversationId: string;
  newOwnerId: string;
  previousOwnerId: string;
}

export interface ParticipantAddedPayload {
  conversationId: string;
  newParticipants: string[];
  addedBy: string;
}

export interface ParticipantRemovedPayload {
  conversationId: string;
  removedUserId: string;
  removedBy: string;
}

export interface ParticipantRoleChangedPayload {
  conversationId: string;
  targetUserId: string;
  isPromotion: boolean;
  promotedBy?: string;
  demotedBy?: string;
}

export interface ConnectedPayload {
  userId: string;
}
