import { create } from 'zustand';
import { gatewayApi } from '@/services/gateway.api';

interface LastSeenMap {
  [userId: string]: string;
}

interface PresenceState {
  onlineUsers: Set<string>;
  lastSeen: LastSeenMap;
  isOnline: (userId: string) => boolean;
  getLastSeen: (userId: string) => string | null;
  setOnline: (userId: string) => void;
  setOffline: (userId: string, lastSeen?: string) => void;
  setBatchOnline: (userIds: string[]) => void;
  fetchAndSetOnline: (userIds: string[]) => Promise<void>;
  reset: () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: new Set<string>(),
  lastSeen: {},

  isOnline: (userId: string) => get().onlineUsers.has(userId),

  getLastSeen: (userId: string) => get().lastSeen[userId] || null,

  setOnline: (userId: string) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.add(userId);
      return { onlineUsers: next };
    }),

  setOffline: (userId: string, lastSeen?: string) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(userId);
      return {
        onlineUsers: next,
        lastSeen: lastSeen ? { ...state.lastSeen, [userId]: lastSeen } : state.lastSeen,
      };
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
      set((state) => {
        const next = new Set(state.onlineUsers);
        for (const [id, online] of Object.entries(res.status)) {
          if (online) next.add(id);
          else next.delete(id);
        }
        return { onlineUsers: next };
      });
    } catch {
      // Silently fail - presence will be updated via socket events
    }
  },

  reset: () => set({ onlineUsers: new Set(), lastSeen: {} }),
}));
