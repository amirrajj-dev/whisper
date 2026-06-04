import type { PopulatedUser } from './user';

export type MessageType = 'text' | 'image' | 'file' | 'voice' | 'video';

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string | PopulatedUser;
  type: MessageType;
  content: string;
  publicId?: string;
  replyTo?: string | ReplyPreview;
  edited: boolean;
  deleted: boolean;
  deliveredTo: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReplyPreview {
  _id: string;
  content: string;
  type: MessageType;
  senderId: string | PopulatedUser;
}

export interface SendMessagePayload {
  conversationId: string;
  type: MessageType;
  content: string;
  replyTo?: string;
}

export interface EditMessagePayload {
  content: string;
}
