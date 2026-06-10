import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/services/auth.api';
import { secureStorage } from '@/libs/secure-storage';
import { appEvents } from '@/libs/event-emitter';

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
      } catch {
        try {
          const refreshToken = await secureStorage.getRefreshToken();
          const tokens = await authApi.refresh(refreshToken ?? undefined);
          await secureStorage.setAccessToken(tokens.access_token);
          await secureStorage.setRefreshToken(tokens.refresh_token);
          const user = await authApi.me();
          store.setUser(user);
          store.setIsAuthenticated(true);
        } catch {
          await secureStorage.clearTokens();
          store.setUser(null);
          store.setIsAuthenticated(false);
        }
      } finally {
        useAuthStore.getState().setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    const handleForceLogout = async () => {
      await secureStorage.clearTokens();
      useAuthStore.getState().logout();
    };

    const unsub = appEvents.on('auth:logout', handleForceLogout);
    return () => unsub();
  }, []);

  return <>{children}</>;
}
