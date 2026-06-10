import { useEffect, useRef, useCallback } from "react";
import { socketManager } from "./socket/socket.manager";
import { useAuthStore } from "@/stores/auth.store";
import { useChatStore } from "@/stores/chat.store";
import { useNotificationStore } from "@/stores/notification.store";
import { usePresenceStore } from "@/stores/presence.store";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/services/auth.api";
import { secureStorage } from "@/libs/secure-storage";
import type { ServerToClientEvents } from "@/types/socket/events";
import type { SocketHandlerDeps } from "./socket/socket-handler-deps";
import type { InfiniteData } from "@tanstack/react-query";
import type { Conversation } from "@/types/entities/conversation";
import { registerMessageHandlers } from "./socket/socket-message-handlers";
import { registerConversationHandlers } from "./socket/socket-conversation-handlers";
import { registerParticipantHandlers } from "./socket/socket-participant-handlers";
import { registerPresenceHandlers } from "./socket/socket-presence-handlers";
import { registerNotificationHandlers } from "./socket/socket-notification-handlers";
import { registerConnectionHandlers, syncConversationRooms } from "./socket/socket-connection-handlers";
import { appEvents } from "@/libs/event-emitter";

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

    let cancelled = false;

    const unsubAuthError = socketManager.onAuthError(async () => {
      try {
        const refreshToken = await secureStorage.getRefreshToken();
        const tokens = await authApi.refresh(refreshToken ?? undefined);
        if (tokens) {
          await secureStorage.setAccessToken(tokens.access_token);
          await secureStorage.setRefreshToken(tokens.refresh_token);
        }
        socketManager.reconnect();
      } catch {
        appEvents.emit("auth:logout");
      }
    });
    cleanupRef.current.push(unsubAuthError);

    (async () => {
      await socketManager.connect();
      if (cancelled) return;

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

      const existingData = queryClient.getQueryData<
        InfiniteData<{ conversations: Conversation[] }>
      >(["conversations"]);
      if (existingData?.pages?.length) {
        syncConversationRooms(existingData, user, setOnline, fetchAndSetOnline);
      }
    })();

    const unsubCache = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.query.queryKey?.[0] === "conversations"
      ) {
        const data = event.query.state
          .data as InfiniteData<{ conversations: Conversation[] }> | null;
        if (data?.pages?.length) {
          syncConversationRooms(data, user, setOnline, fetchAndSetOnline);
        }
      }
    });
    cleanupRef.current.push(unsubCache);

    return () => {
      cancelled = true;
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
