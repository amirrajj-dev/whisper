export interface CreateConversationDto {
  type: 'private' | 'group';
  participants: string[];
  name?: string;
}

export interface SendMessageDto {
  conversationId: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'video';
  content: string;
  replyTo?: string;
}

export interface EditMessageDto {
  content: string;
}

export interface AddParticipantsDto {
  userIds: string[];
}

export interface UpdateConversationDto {
  name?: string;
}

export interface TransferOwnershipDto {
  newOwnerId: string;
}
