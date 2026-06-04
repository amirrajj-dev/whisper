import { create } from 'zustand';

interface TypingUser {
  userId: string;
  username: string;
}

interface ChatState {
  activeConversationId: string | null;
  conversationsSearch: string;
  replyingTo: { messageId: string; content: string; senderName: string } | null;
  editingMessage: { messageId: string; content: string } | null;
  typingUsers: Record<string, TypingUser[]>;
  isSearchActive: boolean;
  searchQuery: string;
  searchActiveMatchIndex: number;
  searchMatchIds: string[];
  setActiveConversation: (id: string | null) => void;
  setConversationsSearch: (query: string) => void;
  setReplyingTo: (reply: { messageId: string; content: string; senderName: string } | null) => void;
  setEditingMessage: (edit: { messageId: string; content: string } | null) => void;
  addTypingUser: (conversationId: string, user: TypingUser) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  clearTypingUsers: (conversationId: string) => void;
  setSearchActive: (active: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchActiveMatchIndex: (index: number) => void;
  setSearchMatchIds: (ids: string[]) => void;
  clearSearch: () => void;
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
  setActiveConversation: (id) => set({ activeConversationId: id, editingMessage: null, replyingTo: null }),
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
}));
