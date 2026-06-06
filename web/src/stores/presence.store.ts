import { create } from 'zustand';
import { gatewayApi } from '@/src/services/gateway.api';

interface PresenceState {
  onlineUsers: Set<string>;
  isOnline: (userId: string) => boolean;
  setOnline: (userId: string) => void;
  setOffline: (userId: string) => void;
  setBatchOnline: (userIds: string[]) => void;
  fetchAndSetOnline: (userIds: string[]) => Promise<void>;
  reset: () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: new Set<string>(),

  isOnline: (userId: string) => get().onlineUsers.has(userId),

  setOnline: (userId: string) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.add(userId);
      return { onlineUsers: next };
    }),

  setOffline: (userId: string) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    }),

  setBatchOnline: (userIds: string[]) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      for (const id of userIds) {
        next.add(id);
      }
      return { onlineUsers: next };
    }),

  fetchAndSetOnline: async (userIds: string[]) => {
    if (userIds.length === 0) return;
    try {
      const res = await gatewayApi.checkOnlineBatch(userIds);
      const onlineIds = Object.entries(res.status)
        .filter(([, online]) => online)
        .map(([id]) => id);
      set((state) => {
        const next = new Set(state.onlineUsers);
        for (const id of onlineIds) {
          next.add(id);
        }
        return { onlineUsers: next };
      });
    } catch {
      // Silently fail - presence will be updated via socket events
    }
  },

  reset: () => set({ onlineUsers: new Set() }),
}));
