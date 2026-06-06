import { create } from 'zustand';
import type { User } from '@/src/types/entities/user';
import { usePresenceStore } from '@/src/stores/presence.store';

interface AuthState {
  user: (Omit<User, 'password'>) | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: (Omit<User, 'password'>) | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setIsLoading: (value) => set({ isLoading: value }),
  logout: () => {
    usePresenceStore.getState().reset();
    set({ user: null, isAuthenticated: false });
  },
}));
