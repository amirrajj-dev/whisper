import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/services/chat.api';
import { useChatStore } from '@/stores/chat.store';
import Toast from 'react-native-toast-message';
import type { CreateConversationDto, SendMessageDto, EditMessageDto, UpdateConversationDto } from '@/types/dto/chat';
import type { Message } from '@/types/entities/message';
import type { Conversation } from '@/types/entities/conversation';
import type { InfiniteData } from '@tanstack/react-query';

const CONVERSATIONS_PER_PAGE = 20;
const MESSAGES_PER_PAGE = 50;

export function useConversations() {
  return useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: ({ pageParam = 1 }) =>
      chatApi.getConversations({ page: pageParam, limit: CONVERSATIONS_PER_PAGE }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => chatApi.getConversation(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useMessages(conversationId: string | null) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam = 1 }) =>
      chatApi.getMessages(conversationId!, { page: pageParam, limit: MESSAGES_PER_PAGE }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!conversationId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConversationDto) => chatApi.createConversation(data),
    onSuccess: (raw) => {
      const result = raw as Conversation & { isExisting?: boolean };
      const conversation = result as Conversation;
      queryClient.setQueryData<InfiniteData<{ conversations: Conversation[]; page: number; totalPages: number }>>(
        ['conversations'],
        (old) => {
          if (!old?.pages?.length) return old;
          const pages = [...old.pages];
          pages[0] = { ...pages[0], conversations: [conversation, ...pages[0].conversations] };
          return { ...old, pages };
        },
      );
      Toast.show({ type: 'success', text1: result.isExisting ? 'Conversation already exists' : 'Conversation created' });
    },
    onError: (error: { message?: string }) => {
      Toast.show({ type: 'error', text1: error.message || 'Failed to create conversation' });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, file }: { data: SendMessageDto; file?: File }) =>
      chatApi.sendMessage(data, file),
    onSuccess: (message, variables) => {
      queryClient.setQueryData<InfiniteData<{ messages: Message[]; page: number; totalPages: number }>>(
        ['messages', variables.data.conversationId],
        (old) => {
          if (!old?.pages?.length) return old;
          const exists = old.pages.some((page) =>
            page.messages.some((m) => m._id === message._id),
          );
          if (exists) return old;
          const pages = [...old.pages];
          pages[0] = { ...pages[0], messages: [...pages[0].messages, message] };
          return { ...old, pages };
        },
      );

      const sendData = variables.data;
      const lastMessagePreview =
        sendData.type === 'text'
          ? sendData.content.substring(0, 100)
          : `[${sendData.type}]`;

      queryClient.setQueryData<InfiniteData<{ conversations: Conversation[] }>>(
        ['conversations'],
        (old) => {
          if (!old?.pages) return old;

          let moved: Conversation | null = null;
          const pages = old.pages.map((page) => {
            const remaining = page.conversations.filter((c) => {
              if (c._id === variables.data.conversationId) {
                moved = {
                  ...c,
                  lastMessage: lastMessagePreview,
                  lastMessageAt: message.createdAt,
                };
                return false;
              }
              return true;
            });
            return { ...page, conversations: remaining };
          });

          if (!moved) return old;

          pages[0] = {
            ...pages[0],
            conversations: [moved, ...pages[0].conversations],
          };
          return { ...old, pages };
        },
      );
    },
    onError: (error: { message?: string }) => {
      Toast.show({ type: 'error', text1: error.message || 'Failed to send message' });
    },
  });
}

export function useEditMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, data }: { messageId: string; conversationId: string; data: EditMessageDto }) =>
      chatApi.editMessage(messageId, data),
    onSuccess: (message, variables) => {
      const { conversationId } = variables;
      if (conversationId) {
        queryClient.setQueryData<InfiniteData<{ messages: Message[] }>>(
          ['messages', conversationId],
          (old) => {
            if (!old?.pages) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                messages: page.messages.map((msg) =>
                  msg._id === message._id ? message : msg,
                ),
              })),
            };
          },
        );
      }
    },
    onError: (error: { message?: string }) => {
      Toast.show({ type: 'error', text1: error.message || 'Failed to edit message' });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  const { activeConversationId } = useChatStore();

  return useMutation({
    mutationFn: (messageId: string) => chatApi.deleteMessage(messageId),
    onSuccess: (_data, messageId) => {
      if (activeConversationId) {
        queryClient.setQueryData<InfiniteData<{ messages: Message[] }>>(
          ['messages', activeConversationId],
          (old) => {
            if (!old?.pages) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                messages: page.messages.map((msg) =>
                  msg._id === messageId
                    ? { ...msg, deleted: true, content: '', type: 'text' as const }
                    : msg,
                ),
              })),
            };
          },
        );
      }
    },
    onError: (error: { message?: string }) => {
      Toast.show({ type: 'error', text1: error.message || 'Failed to delete message' });
    },
  });
}

export function useAddParticipants() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, userIds }: { conversationId: string; userIds: string[] }) =>
      chatApi.addParticipants(conversationId, { userIds }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      Toast.show({ type: 'success', text1: 'Participants added' });
    },
    onError: (error: { message?: string }) => {
      Toast.show({ type: 'error', text1: error.message || 'Failed to add participants' });
    },
  });
}

export function useRemoveParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      chatApi.removeParticipant(conversationId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      Toast.show({ type: 'success', text1: 'Participant removed' });
    },
    onError: (error: { message?: string }) => {
      Toast.show({ type: 'error', text1: error.message || 'Failed to remove participant' });
    },
  });
}

export function usePromoteToAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      chatApi.promoteToAdmin(conversationId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      Toast.show({ type: 'success', text1: 'User promoted to admin' });
    },
    onError: (error: { message?: string }) => {
      Toast.show({ type: 'error', text1: error.message || 'Failed to promote user' });
    },
  });
}

export function useDemoteFromAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      chatApi.demoteFromAdmin(conversationId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      Toast.show({ type: 'success', text1: 'User demoted from admin' });
    },
    onError: (error: { message?: string }) => {
      Toast.show({ type: 'error', text1: error.message || 'Failed to demote user' });
    },
  });
}

export function useTransferOwnership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, newOwnerId }: { conversationId: string; newOwnerId: string }) =>
      chatApi.transferOwnership(conversationId, { newOwnerId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      Toast.show({ type: 'success', text1: 'Ownership transferred' });
    },
    onError: (error: { message?: string }) => {
      Toast.show({ type: 'error', text1: error.message || 'Failed to transfer ownership' });
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, avatarFile }: { id: string; data: UpdateConversationDto; avatarFile?: File }) =>
      chatApi.updateConversation(id, data, avatarFile),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      Toast.show({ type: 'success', text1: 'Conversation updated' });
    },
    onError: (error: { message?: string }) => {
      Toast.show({ type: 'error', text1: error.message || 'Failed to update conversation' });
    },
  });
}

export function useMessageUnreadCounts() {
  const queryClient = useQueryClient();
  const { setUnreadCounts } = useChatStore();

  return useQuery({
    queryKey: ['message-unread-counts'],
    queryFn: () => chatApi.getUnreadCounts(),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const { activeConversationId, setActiveConversation } = useChatStore();

  return useMutation({
    mutationFn: (conversationId: string) => chatApi.deleteConversation(conversationId),
    onSuccess: (_data, conversationId) => {
      queryClient.setQueryData<InfiniteData<{ conversations: Conversation[] }>>(
        ['conversations'],
        (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              conversations: page.conversations.filter((c) => c._id !== conversationId),
            })),
          };
        },
      );
      if (activeConversationId === conversationId) {
        setActiveConversation(null);
      }
      queryClient.removeQueries({ queryKey: ['conversation', conversationId] });
      queryClient.removeQueries({ queryKey: ['messages', conversationId] });
      Toast.show({ type: 'success', text1: 'Conversation deleted' });
    },
    onError: (error: { message?: string }) => {
      Toast.show({ type: 'error', text1: error.message || 'Failed to delete conversation' });
    },
  });
}
