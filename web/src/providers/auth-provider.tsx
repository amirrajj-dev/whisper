'use client';

import { useEffect, useRef } from 'react';
import * as Sentry from '@sentry/nextjs';
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
        Sentry.setUser({ id: user._id });
      } catch {
        try {
          await authApi.refresh();
          const user = await authApi.me();
          store.setUser(user);
          store.setIsAuthenticated(true);
          Sentry.setUser({ id: user._id });
        } catch (e) {
          const err = e as { statusCode?: number };
          if (!err.statusCode || err.statusCode >= 500) {
            Sentry.captureException(e, {
              tags: { type: 'auth-hydration-failure' },
            });
          }
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
    const handleForceLogout = () => {
      Sentry.setUser(null);
      socketManager.fullCleanup();
      useAuthStore.getState().logout();
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  return <>{children}</>;
}
