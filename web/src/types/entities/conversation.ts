import type { PopulatedUser } from './user';

export type ConversationType = 'private' | 'group';

export interface Conversation {
  _id: string;
  type: ConversationType;
  participants: string[] | PopulatedUser[];
  name?: string;
  avatarUrl?: string;
  publicId?: string;
  admins?: string[];
  owner?: string;
  lastMessage?: string;
  lastMessageAt: string;
  createdBy: string | PopulatedUser;
  createdAt: string;
  updatedAt: string;
}
