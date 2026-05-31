export type Conversation = {
  _id: string;
  type: ConversationType;
  participants: string[];
  name?: string;
  avatarUrl?: string;
  publicId?: string;
  admins?: string[];
  owner?: string;
  lastMessage: string;
  lastMessageAt: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ConversationType = 'private' | 'group';
