export type Conversation = {
  _id: string;
  type: ConversationType;
  participants: string[];
  name?: string;
  avatarUrl?: string;
  admins: string[];
  lastMessage: string;
  lastMessageAt: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ConversationType = 'private' | 'group';
