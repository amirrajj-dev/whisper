import { create } from 'zustand';
import type { User } from '@/src/types/entities/user';

interface AuthState {
  user: (Omit<User, 'password'>) | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  setUser: (user: (Omit<User, 'password'>) | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  accessToken: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setIsLoading: (value) => set({ isLoading: value }),
  setAccessToken: (token) => set({ accessToken: token }),
  logout: () => set({ user: null, isAuthenticated: false, accessToken: null }),
}));
