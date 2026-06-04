"use client";

import { useEffect, useRef, useCallback } from "react";
import { socketManager } from "@/src/socket/socket.manager";
import { useAuthStore } from "@/src/stores/auth.store";
import { useChatStore } from "@/src/stores/chat.store";
import { useNotificationStore } from "@/src/stores/notification.store";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/src/services/auth.api";
import type {
  ServerToClientEvents,
  MessageNewPayload,
  MessageEditedPayload,
  MessageDeletedPayload,
  UserOnlinePayload,
  UserOfflinePayload,
  MessageReadPayload,
  ConversationUpdatedPayload,
  ConversationDeletedPayload,
  OwnershipTransferredPayload,
  ParticipantRemovedPayload,
} from "@/src/types/socket/events";
import type { Message } from "@/src/types/entities/message";
import type { Conversation } from "@/src/types/entities/conversation";
import type { Notification } from "@/src/types/entities/notification";
import type { PopulatedUser } from "@/src/types/entities/user";
import type { InfiniteData } from "@tanstack/react-query";

function getTypingUsername(
  conversationsData:
    | InfiniteData<{ conversations: Conversation[] }>
    | undefined,
  conversationId: string,
  userId: string,
): string {
  if (!conversationsData?.pages) return "";
  for (const page of conversationsData.pages) {
    for (const c of page.conversations) {
      if (c._id === conversationId) {
        const participants: Array<{ _id: string; username: string }> =
          (c as unknown as { participants: Array<{ _id: string; username: string }> }).participants || [];
        const u = participants.find((p) => p._id === userId);
        return u?.username || "";
      }
    }
  }
  return "";
}

export function useSocket() {
  const { isAuthenticated, user, accessToken } = useAuthStore();
  const { addTypingUser, removeTypingUser, incrementUnread: incrementConvUnread } = useChatStore();
  const { incrementUnread } = useNotificationStore();
  const queryClient = useQueryClient();
  const cleanupRef = useRef<(() => void)[]>([]);
  const isSetupRef = useRef(false);

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
      isSetupRef.current = false;
      return;
    }

    if (isSetupRef.current) return;

    if (!accessToken) return;

    try {
      socketManager.connect(accessToken);
      isSetupRef.current = true;
    } catch {
      return;
    }

    const unsubAuthError = socketManager.onAuthError(async () => {
      try {
        const refreshRes = await authApi.refresh();
        const store = useAuthStore.getState();
        store.setAccessToken(refreshRes.access_token);
      } catch {
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
    });
    cleanupRef.current.push(unsubAuthError);

    registerEvent("message:new", (data: MessageNewPayload) => {
      const queryKey = ["messages", data.conversationId];

      queryClient.setQueryData<
        InfiniteData<{ messages: Message[]; page: number; totalPages: number }>
      >(queryKey, (old) => {
        if (!old?.pages?.length) return old;
        const exists = old.pages.some((page) =>
          page.messages.some((m) => m._id === data.messageId),
        );
        if (exists) return old;
        const newMessage: Message = {
          _id: data.messageId,
          conversationId: data.conversationId,
          senderId: data.senderId,
          type: data.type,
          content: data.content,
          edited: false,
          deleted: false,
          deliveredTo: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Message;
        if (data.message && typeof data.message === "object") {
          Object.assign(newMessage, data.message);
        }
        const pages = [...old.pages];
        pages[0] = {
          ...pages[0],
          messages: [...pages[0].messages, newMessage],
        };
        return { ...old, pages };
      });

      queryClient.setQueryData<
        InfiniteData<{
          conversations: Conversation[];
          page: number;
          totalPages: number;
        }>
      >(["conversations"], (old) => {
        if (!old?.pages?.length) return old;
        const newLastMessageAt = data.message && typeof data.message === "object" && "createdAt" in data.message
          ? (data.message as { createdAt: string }).createdAt
          : new Date().toISOString();
        const newContent = data.content;

        let updatedConv: Conversation | null = null;
        const pages = old.pages.map((page) => {
          const filtered = page.conversations.filter((c) => {
            if (c._id === data.conversationId) {
              updatedConv = {
                ...c,
                lastMessage: newContent,
                lastMessageAt: newLastMessageAt,
              };
              return false;
            }
            return true;
          });
          return { ...page, conversations: filtered };
        });

        if (!updatedConv) return old;

        pages[0] = {
          ...pages[0],
          conversations: [updatedConv, ...pages[0].conversations],
        };
        return { ...old, pages };
      });

      const currentActiveId = useChatStore.getState().activeConversationId;
      if (data.senderId !== user?._id && data.conversationId !== currentActiveId) {
        incrementConvUnread(data.conversationId);
      }
    });

    registerEvent("message:edited", (data: MessageEditedPayload) => {
      const queryKey = ["messages", data.conversationId];

      queryClient.setQueryData<InfiniteData<{ messages: Message[] }>>(
        queryKey,
        (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((msg) =>
                msg._id === data.messageId
                  ? { ...msg, content: data.content, edited: true }
                  : msg,
              ),
            })),
          };
        },
      );
    });

    registerEvent("message:deleted", (data: MessageDeletedPayload) => {
      const queryKey = ["messages", data.conversationId];

      queryClient.setQueryData<InfiniteData<{ messages: Message[] }>>(
        queryKey,
        (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((msg) =>
                msg._id === data.messageId
                  ? {
                      ...msg,
                      deleted: true,
                      content: "",
                      type: "text" as const,
                    }
                  : msg,
              ),
            })),
          };
        },
      );
    });

    registerEvent("message:read", (data: MessageReadPayload) => {
      const queryKey = ["messages", data.conversationId];

      queryClient.setQueryData<InfiniteData<{ messages: Message[] }>>(
        queryKey,
        (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((msg) =>
                msg._id === data.messageId
                  ? {
                      ...msg,
                      deliveredTo: msg.deliveredTo
                        ? [...new Set([...msg.deliveredTo, data.userId])]
                        : [data.userId],
                    }
                  : msg,
              ),
            })),
          };
        },
      );
    });

    registerEvent("user:typing", (data) => {
      const conversationsData = queryClient.getQueryData<
        InfiniteData<{ conversations: Conversation[] }>
      >(["conversations"]);
      const username = getTypingUsername(
        conversationsData,
        data.conversationId,
        data.userId,
      );
      addTypingUser(data.conversationId, {
        userId: data.userId,
        username,
      });
    });

    registerEvent("user:stop_typing", (data) => {
      removeTypingUser(data.conversationId, data.userId);
    });

    registerEvent("user:online", (data: UserOnlinePayload) => {
      queryClient.setQueryData<InfiniteData<{ conversations: Conversation[] }>>(
        ["conversations"],
        (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              conversations: page.conversations.map((c) => {
                const participants = (c as unknown as { participants: Array<{ _id: string; lastSeen?: string | null }> }).participants || [];
                return {
                  ...c,
                  participants: participants.map((p) =>
                    p._id === data.userId ? { ...p, lastSeen: null } : p,
                  ),
                } as Conversation;
              }),
            })),
          };
        },
      );

      const activeId = useChatStore.getState().activeConversationId;
      if (activeId) {
        queryClient.setQueryData<Conversation>(["conversation", activeId], (old) => {
          if (!old) return old;
          return {
            ...old,
            participants: (old.participants as PopulatedUser[]).map((p) =>
              p._id === data.userId ? { ...p, lastSeen: null as string | null | undefined } : p,
            ) as PopulatedUser[],
          };
        });
      }
    });

    registerEvent("user:offline", (data: UserOfflinePayload) => {
      queryClient.setQueryData<InfiniteData<{ conversations: Conversation[] }>>(
        ["conversations"],
        (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              conversations: page.conversations.map((c) => {
                const participants = (c as unknown as { participants: Array<{ _id: string; lastSeen?: string | null }> }).participants || [];
                return {
                  ...c,
                  participants: participants.map((p) =>
                    p._id === data.userId
                      ? { ...p, lastSeen: data.lastSeen }
                      : p,
                  ),
                } as Conversation;
              }),
            })),
          };
        },
      );

      const activeId = useChatStore.getState().activeConversationId;
      if (activeId) {
        queryClient.setQueryData<Conversation>(["conversation", activeId], (old) => {
          if (!old) return old;
          return {
            ...old,
            participants: (old.participants as PopulatedUser[]).map((p) =>
              p._id === data.userId ? { ...p, lastSeen: data.lastSeen as string | null | undefined } : p,
            ) as PopulatedUser[],
          };
        });
      }
    });

    registerEvent("conversation:new", () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    registerEvent(
      "conversation:updated",
      (data: ConversationUpdatedPayload) => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({
          queryKey: ["conversation", data.conversationId],
        });
      },
    );

    registerEvent(
      "conversation:deleted",
      (data: ConversationDeletedPayload) => {
        queryClient.setQueryData<
          InfiniteData<{ conversations: Conversation[] }>
        >(["conversations"], (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              conversations: page.conversations.filter(
                (c) => c._id !== data.conversationId,
              ),
            })),
          };
        });

        if (
          useChatStore.getState().activeConversationId === data.conversationId
        ) {
          useChatStore.getState().setActiveConversation(null);
        }
      },
    );

    registerEvent(
      "conversation:ownership_transferred",
      (data: OwnershipTransferredPayload) => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({
          queryKey: ["conversation", data.conversationId],
        });
      },
    );

    registerEvent("participant:added", () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    registerEvent("participant:removed", (data: ParticipantRemovedPayload) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      if (data.removedUserId === user._id) {
        queryClient.removeQueries({
          queryKey: ["conversation", data.conversationId],
        });
        if (
          useChatStore.getState().activeConversationId === data.conversationId
        ) {
          useChatStore.getState().setActiveConversation(null);
        }
      }
    });

    registerEvent("participant:role_changed", () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    registerEvent("connected", (data) => {
      const currentUserId = data.userId;
      queryClient.setQueryData<
        InfiniteData<{ conversations: Conversation[] }>
      >(["conversations"], (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            conversations: page.conversations.map((c) => {
              const participants = (c as unknown as { participants: Array<{ _id: string; lastSeen?: string | null }> }).participants || [];
              return {
                ...c,
                participants: participants.map((p) =>
                  p._id === currentUserId ? { ...p, lastSeen: null } : p,
                ),
              } as Conversation;
            }),
          })),
        };
      });
    });

    registerEvent("notification:new", (data) => {
      const notification = data as unknown as Notification;
      queryClient.setQueryData<
        InfiniteData<{ notifications: Notification[] }>
      >(["notifications"], (old) => {
        if (!old?.pages?.length) {
          return {
            pages: [
              { notifications: [notification], page: 1, totalPages: 1 },
            ],
            pageParams: [1],
          };
        }
        const pages = [...old.pages];
        pages[0] = {
          ...pages[0],
          notifications: [notification, ...pages[0].notifications],
        };
        return { ...old, pages };
      });
      incrementUnread();
    });

    return () => {
      cleanupRef.current.forEach((fn) => fn());
      cleanupRef.current = [];
      isSetupRef.current = false;
    };
  }, [
    isAuthenticated,
    user?._id,
    accessToken,
    addTypingUser,
    removeTypingUser,
    incrementUnread,
    incrementConvUnread,
    queryClient,
    user,
    registerEvent,
  ]);

  return socketManager;
}
