import { api } from '@/libs/axios';
import type { Conversation } from '@/types/entities/conversation';
import type { Message } from '@/types/entities/message';
import type { ConversationListResponse, MessageListResponse } from '@/types/api/responses';
import type {
  CreateConversationDto,
  SendMessageDto,
  EditMessageDto,
  AddParticipantsDto,
  UpdateConversationDto,
  TransferOwnershipDto,
} from '@/types/dto/chat';
import type { PaginationDto } from '@/types/dto/pagination';

export const chatApi = {
  getUnreadCounts: () =>
    api.get<Record<string, number>>('/chat/unread-counts').then((r) => r.data),

  getConversations: (params?: PaginationDto) =>
    api.get<ConversationListResponse>('/chat/conversations', { params }).then((r) => r.data),

  getConversation: (id: string) =>
    api.get<Conversation>(`/chat/conversations/${id}`).then((r) => r.data),

  createConversation: (data: CreateConversationDto, avatarFile?: File) => {
    const formData = new FormData();
    formData.append('type', data.type);
    data.participants.forEach((p) => formData.append('participants[]', p));
    if (data.name) formData.append('name', data.name);
    if (avatarFile) formData.append('avatar', avatarFile);
    return api.post<Conversation>('/chat/conversations', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  updateConversation: (id: string, data: UpdateConversationDto, avatarFile?: File) => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (avatarFile) formData.append('avatar', avatarFile);
    return api.patch<Conversation>(`/chat/conversations/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  deleteConversation: (id: string) =>
    api.delete<{ message: string }>(`/chat/conversations/${id}`).then((r) => r.data),

  getMessages: (conversationId: string, params?: PaginationDto) =>
    api.get<MessageListResponse>(`/chat/messages/${conversationId}`, { params }).then((r) => r.data),

  sendMessage: (data: SendMessageDto, file?: File) => {
    const formData = new FormData();
    formData.append('conversationId', data.conversationId);
    formData.append('type', data.type);
    formData.append('content', data.content);
    if (data.replyTo) formData.append('replyTo', data.replyTo);
    if (file) formData.append('file', file);
    return api.post<Message>('/chat/messages', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  editMessage: (messageId: string, data: EditMessageDto) =>
    api.patch<Message>(`/chat/messages/${messageId}`, data).then((r) => r.data),

  deleteMessage: (messageId: string) =>
    api.delete<{ message: string }>(`/chat/messages/${messageId}`).then((r) => r.data),

  addParticipants: (conversationId: string, data: AddParticipantsDto) =>
    api.post<Conversation>(`/chat/conversations/${conversationId}/participants`, data).then((r) => r.data),

  removeParticipant: (conversationId: string, userId: string) =>
    api.delete<Conversation>(`/chat/conversations/${conversationId}/participants/${userId}`).then((r) => r.data),

  promoteToAdmin: (conversationId: string, userId: string) =>
    api.post<Conversation>(`/chat/conversations/${conversationId}/admins/${userId}`).then((r) => r.data),

  demoteFromAdmin: (conversationId: string, userId: string) =>
    api.delete<Conversation>(`/chat/conversations/${conversationId}/admins/${userId}`).then((r) => r.data),

  transferOwnership: (conversationId: string, data: TransferOwnershipDto) =>
    api.post<Conversation>(`/chat/conversations/${conversationId}/owner`, data).then((r) => r.data),
};
