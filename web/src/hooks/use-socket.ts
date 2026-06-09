"use client";

import { useEffect, useRef, useCallback } from "react";
import { socketManager } from "@/src/socket/socket.manager";
import { useAuthStore } from "@/src/stores/auth.store";
import { useChatStore } from "@/src/stores/chat.store";
import { useNotificationStore } from "@/src/stores/notification.store";
import { usePresenceStore } from "@/src/stores/presence.store";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/src/services/auth.api";
import type { ServerToClientEvents } from "@/src/types/socket/events";
import type { SocketHandlerDeps } from "./socket/socket-handler-deps";
import { registerMessageHandlers } from "./socket/socket-message-handlers";
import { registerConversationHandlers } from "./socket/socket-conversation-handlers";
import { registerParticipantHandlers } from "./socket/socket-participant-handlers";
import { registerPresenceHandlers } from "./socket/socket-presence-handlers";
import { registerNotificationHandlers } from "./socket/socket-notification-handlers";
import { registerConnectionHandlers } from "./socket/socket-connection-handlers";

export function useSocket() {
  const { isAuthenticated, user } = useAuthStore();
  const { addTypingUser, removeTypingUser, incrementUnread: incrementConvUnread } = useChatStore();
  const { incrementUnread } = useNotificationStore();
  const { setOnline, setOffline, fetchAndSetOnline } = usePresenceStore();
  const queryClient = useQueryClient();
  const cleanupRef = useRef<(() => void)[]>([]);

  const registerEvent = useCallback(
    <E extends keyof ServerToClientEvents>(
      event: E,
      handler: ServerToClientEvents[E],
    ) => {
      const unsub = socketManager.on(event, handler as (...args: unknown[]) => void);
      cleanupRef.current.push(unsub);
    },
    [],
  );

  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketManager.disconnect();
      return;
    }

    try {
      socketManager.connect();
    } catch {
      return;
    }

    const unsubAuthError = socketManager.onAuthError(async () => {
      try {
        await authApi.refresh();
        socketManager.reconnect();
      } catch {
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
    });
    cleanupRef.current.push(unsubAuthError);

    const deps: SocketHandlerDeps = {
      queryClient,
      user,
      addTypingUser,
      removeTypingUser,
      incrementConvUnread,
      incrementUnread,
      setOnline,
      setOffline,
      fetchAndSetOnline,
    };

    registerMessageHandlers(registerEvent, deps);
    registerConversationHandlers(registerEvent, deps);
    registerParticipantHandlers(registerEvent, deps);
    registerPresenceHandlers(registerEvent, deps);
    registerNotificationHandlers(registerEvent, deps);
    registerConnectionHandlers(registerEvent, deps);

    return () => {
      cleanupRef.current.forEach((fn) => fn());
      cleanupRef.current = [];
    };
  }, [
    isAuthenticated,
    addTypingUser,
    removeTypingUser,
    incrementUnread,
    incrementConvUnread,
    queryClient,
    user,
    registerEvent,
    setOnline,
    setOffline,
    fetchAndSetOnline,
  ]);

  return socketManager;
}
