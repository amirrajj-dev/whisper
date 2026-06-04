'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/src/stores/auth.store';
import { authApi } from '@/src/services/auth.api';
import { socketManager } from '@/src/socket/socket.manager';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initAuth = async () => {
      const store = useAuthStore.getState();
      store.setIsLoading(true);

      try {
        const user = await authApi.me();
        store.setUser(user);
        store.setIsAuthenticated(true);

        try {
          const refreshRes = await authApi.refresh();
          store.setAccessToken(refreshRes.access_token);
        } catch {
          store.setAccessToken(null);
        }
      } catch {
        store.setUser(null);
        store.setIsAuthenticated(false);
        store.setAccessToken(null);
      } finally {
        useAuthStore.getState().setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    const handleForceLogout = () => {
      socketManager.disconnect();
      useAuthStore.getState().logout();
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  return <>{children}</>;
}
