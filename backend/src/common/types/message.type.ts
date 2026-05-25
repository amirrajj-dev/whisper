export type Message = {
  _id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  edited: boolean;
  deleted: boolean;
  deliveredTo: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type MessageType = 'text' | 'image' | 'file' | 'voice' | 'video';
