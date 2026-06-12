import { create } from 'zustand';

interface TypingUser {
  userId: string;
  username: string;
}

interface ChatState {
  activeConversationId: string | null;
  conversationsSearch: string;
  replyingTo: { messageId: string; content: string; senderName: string; type?: string } | null;
  editingMessage: { messageId: string; content: string } | null;
  typingUsers: Record<string, TypingUser[]>;
  isSearchActive: boolean;
  searchQuery: string;
  searchActiveMatchIndex: number;
  searchMatchIds: string[];
  unreadCounts: Record<string, number>;
  setActiveConversation: (id: string | null) => void;
  setConversationsSearch: (query: string) => void;
  setReplyingTo: (reply: { messageId: string; content: string; senderName: string; type?: string } | null) => void;
  setEditingMessage: (edit: { messageId: string; content: string } | null) => void;
  addTypingUser: (conversationId: string, user: TypingUser) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  clearTypingUsers: (conversationId: string) => void;
  setSearchActive: (active: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchActiveMatchIndex: (index: number) => void;
  setSearchMatchIds: (ids: string[]) => void;
  clearSearch: () => void;
  incrementUnread: (conversationId: string) => void;
  resetUnread: (conversationId: string) => void;
  setUnreadCounts: (counts: Record<string, number>) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  conversationsSearch: '',
  replyingTo: null,
  editingMessage: null,
  typingUsers: {},
  isSearchActive: false,
  searchQuery: '',
  searchActiveMatchIndex: -1,
  searchMatchIds: [],
  unreadCounts: {},
  setActiveConversation: (id) => set((state) => {
    const newCounts = id ? { ...state.unreadCounts, [id]: 0 } : state.unreadCounts;
    return { activeConversationId: id, editingMessage: null, replyingTo: null, unreadCounts: newCounts };
  }),
  setConversationsSearch: (query) => set({ conversationsSearch: query }),
  setReplyingTo: (reply) => set({ replyingTo: reply, editingMessage: null }),
  setEditingMessage: (edit) => set({ editingMessage: edit, replyingTo: null }),
  addTypingUser: (conversationId, user) =>
    set((state) => {
      const existing = state.typingUsers[conversationId] || [];
      if (existing.some((u) => u.userId === user.userId)) return state;
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: [...existing, user],
        },
      };
    }),
  removeTypingUser: (conversationId, userId) =>
    set((state) => {
      const existing = state.typingUsers[conversationId] || [];
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: existing.filter((u) => u.userId !== userId),
        },
      };
    }),
  clearTypingUsers: (conversationId) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: [],
      },
    })),
  setSearchActive: (active) =>
    set({
      isSearchActive: active,
      searchQuery: '',
      searchActiveMatchIndex: -1,
      searchMatchIds: [],
    }),
  setSearchQuery: (query) => set({ searchQuery: query, searchActiveMatchIndex: -1 }),
  setSearchActiveMatchIndex: (index) => set({ searchActiveMatchIndex: index }),
  setSearchMatchIds: (ids) =>
    set({
      searchMatchIds: ids,
      searchActiveMatchIndex: ids.length > 0 ? 0 : -1,
    }),
  clearSearch: () =>
    set({
      isSearchActive: false,
      searchQuery: '',
      searchActiveMatchIndex: -1,
      searchMatchIds: [],
    }),
  incrementUnread: (conversationId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: (state.unreadCounts[conversationId] || 0) + 1,
      },
    })),
  resetUnread: (conversationId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: 0,
      },
    })),
  setUnreadCounts: (counts) => set({ unreadCounts: counts }),
}));
