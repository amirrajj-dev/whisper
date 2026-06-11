import type { InfiniteData } from "@tanstack/react-query";
import type { Message } from "@/types/entities/message";
import type { Conversation } from "@/types/entities/conversation";
import type { PopulatedUser } from "@/types/entities/user";
import type {
  MessageNewPayload,
  MessageEditedPayload,
  MessageDeletedPayload,
  MessageReadPayload,
  MessagesReadPayload,
} from "@/types/socket/events";
import { socketManager } from "./socket.manager";
import { useChatStore } from "@/stores/chat.store";
import { moveConversationToTop } from "./socket-utils";
import type { RegisterEvent, SocketHandlerDeps } from "./socket-handler-deps";

export function registerMessageHandlers(
  registerEvent: RegisterEvent,
  { queryClient, user, incrementConvUnread }: SocketHandlerDeps,
): void {
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
        readBy: [],
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
        if (messagePayload.readBy) {
          newMessage.readBy = messagePayload.readBy as string[];
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
          lastMessage: c.type === "group"
            ? `${data.senderUsername}: ${preview}`
            : preview,
          lastMessageAt: newLastMessageAt,
        };
        return updated;
      });

      return result;
    });

    const currentActiveId = useChatStore.getState().activeConversationId;
    if (data.senderId !== user?._id) {
      if (data.conversationId === currentActiveId) {
        socketManager.markAsRead(data.conversationId);
      } else {
        incrementConvUnread(data.conversationId);
      }
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

  registerEvent("messages:read", (data: MessagesReadPayload) => {
    const queryKey = ["messages", data.conversationId];

    queryClient.setQueryData<InfiniteData<{ messages: Message[] }>>(
      queryKey,
      (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((msg) => {
              const senderId = typeof msg.senderId === "string" ? msg.senderId : msg.senderId?._id;
              if (senderId === data.userId) return msg;
              return {
                ...msg,
                readBy: msg.readBy
                  ? [...new Set([...msg.readBy, data.userId])]
                  : [data.userId],
              };
            }),
          })),
        };
      },
    );
  });
}
