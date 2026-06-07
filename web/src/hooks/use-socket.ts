"use client";

import { useEffect, useRef, useCallback } from "react";
import { socketManager } from "@/src/socket/socket.manager";
import { useAuthStore } from "@/src/stores/auth.store";
import { useChatStore } from "@/src/stores/chat.store";
import { useNotificationStore } from "@/src/stores/notification.store";
import { usePresenceStore } from "@/src/stores/presence.store";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/src/services/auth.api";
import type {
  ServerToClientEvents,
  MessageNewPayload,
  MessageEditedPayload,
  MessageDeletedPayload,
  MessageReadPayload,
  ConversationUpdatedPayload,
  ConversationDeletedPayload,
  ConversationNewPayload,
  OwnershipTransferredPayload,
  ParticipantAddedPayload,
  ParticipantRemovedPayload,
  ParticipantRoleChangedPayload,
  UserTypingPayload,
  UserStopTypingPayload,
} from "@/src/types/socket/events";
import type { Message } from "@/src/types/entities/message";
import type { Conversation } from "@/src/types/entities/conversation";
import type { Notification } from "@/src/types/entities/notification";
import type { PopulatedUser } from "@/src/types/entities/user";
import type { InfiniteData } from "@tanstack/react-query";
import { toast } from "sonner";

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

function getOtherParticipantIds(
  conversationsData:
    | InfiniteData<{ conversations: Conversation[] }>
    | undefined,
  currentUserId: string,
): string[] {
  if (!conversationsData?.pages) return [];
  const ids = new Set<string>();
  for (const page of conversationsData.pages) {
    for (const c of page.conversations) {
      const participants = (c as unknown as { participants: Array<{ _id: string }> }).participants || [];
      for (const p of participants) {
        if (p._id !== currentUserId) {
          ids.add(p._id);
        }
      }
    }
  }
  return Array.from(ids);
}

function moveConversationToTop<T extends { conversations: Conversation[] }>(
  oldData: InfiniteData<T>,
  conversationId: string,
  updater: (c: Conversation) => Conversation,
): InfiniteData<T> {
  let moved: Conversation | null = null;
  const pages = oldData.pages.map((page) => {
    const remaining = page.conversations.filter((c) => {
      if (c._id === conversationId) {
        moved = updater(c);
        return false;
      }
      return true;
    });
    return { ...page, conversations: remaining } as T;
  }) as InfiniteData<T>['pages'];

  if (!moved) return oldData;

  pages[0] = {
    ...pages[0],
    conversations: [moved, ...pages[0].conversations],
  } as T;
  return { ...oldData, pages };
}

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

    registerEvent("message:new", (data: MessageNewPayload) => {
      const messagePayload = data.message as Record<string, unknown> | undefined;

      queryClient.setQueryData<
        InfiniteData<{ messages: Message[]; page: number; totalPages: number }>
      >(["messages", data.conversationId], (old) => {
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
          edited: messagePayload?.edited === true,
          deleted: false,
          deliveredTo: [],
          createdAt: (messagePayload?.createdAt as string) || new Date().toISOString(),
          updatedAt: (messagePayload?.updatedAt as string) || new Date().toISOString(),
        };

        if (messagePayload && typeof messagePayload === "object") {
          if (typeof messagePayload.senderId === "object" && messagePayload.senderId !== null) {
            newMessage.senderId = messagePayload.senderId as PopulatedUser;
          }
          if (messagePayload.replyTo) {
            newMessage.replyTo = messagePayload.replyTo as Message["replyTo"];
          }
          if (messagePayload.type && messagePayload.type !== "text") {
            newMessage.type = messagePayload.type as Message["type"];
          }
          if (messagePayload.publicId) {
            newMessage.publicId = messagePayload.publicId as string;
          }
          if (messagePayload.deliveredTo) {
            newMessage.deliveredTo = messagePayload.deliveredTo as string[];
          }
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

        const newLastMessageAt = messagePayload && typeof messagePayload === "object" && "createdAt" in messagePayload
          ? (messagePayload.createdAt as string)
          : new Date().toISOString();
        const preview =
          data.type === "text"
            ? data.content.substring(0, 100)
            : `[${data.type}]`;

        const result = moveConversationToTop(old, data.conversationId, (c) => {
          const updated = {
            ...c,
            lastMessage: c.type === 'group'
              ? `${data.senderUsername}: ${preview}`
              : preview,
            lastMessageAt: newLastMessageAt,
          };
          return updated;
        });

        return result;
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
                  ? { ...msg, deleted: true, content: "", type: "text" as const }
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

    registerEvent("user:typing", (data: UserTypingPayload) => {
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

    registerEvent("user:stop_typing", (data: UserStopTypingPayload) => {
      removeTypingUser(data.conversationId, data.userId);
    });

    registerEvent("user:online", (data) => {
      setOnline(data.userId);

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

    registerEvent("user:offline", (data) => {
      setOffline(data.userId, data.lastSeen);

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

    registerEvent("conversation:new", (data: ConversationNewPayload) => {
      socketManager.joinConversation(data.conversationId);
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
        socketManager.leaveConversation(data.conversationId);

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

    registerEvent("participant:added", (data: ParticipantAddedPayload) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({
        queryKey: ["conversation", data.conversationId],
      });
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
      } else {
        queryClient.invalidateQueries({
          queryKey: ["conversation", data.conversationId],
        });
      }
    });

    registerEvent("participant:role_changed", (data: ParticipantRoleChangedPayload) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({
        queryKey: ["conversation", data.conversationId],
      });
    });

    registerEvent("connected", async () => {
      useChatStore.setState({ typingUsers: {} });

      const results = await queryClient.refetchQueries({
        queryKey: ["conversations"],
      });
      const resultItem = results?.[0] as
        | { data: InfiniteData<{ conversations: Conversation[] }> }
        | undefined;
      const conversationsData = resultItem?.data;

      if (user) {
        setOnline(user._id);
        const otherIds = getOtherParticipantIds(conversationsData, user._id);
        if (otherIds.length > 0) {
          await fetchAndSetOnline(otherIds);
        }
        const activeId = useChatStore.getState().activeConversationId;
        if (activeId) {
          await queryClient.refetchQueries({
            queryKey: ["conversation", activeId],
          });
        }
      }
    });

    registerEvent("notification:new", (data) => {
      const payload = data as Record<string, unknown>;
      const notification: Notification = {
        _id: (payload._id as string) || (payload.id as string) || '',
        userId: '',
        type: (payload.type as Notification['type']) || 'system',
        message: (payload.message as string) || '',
        relatedConversation: payload.relatedConversation as string | undefined,
        isRead: (payload.isRead as boolean) || false,
        createdAt: (payload.createdAt as string) || new Date().toISOString(),
        updatedAt: (payload.createdAt as string) || new Date().toISOString(),
      };

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

      if (notification.message) {
        toast.info(notification.message, {
          duration: 4000,
          position: "top-right",
        });
      }
    });

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
