import type { InfiniteData } from "@tanstack/react-query";
import type { Conversation } from "@/src/types/entities/conversation";
import type { PopulatedUser } from "@/src/types/entities/user";
import type {
  UserTypingPayload,
  UserStopTypingPayload,
} from "@/src/types/socket/events";
import { useChatStore } from "@/src/stores/chat.store";
import { getTypingUsername } from "./socket-utils";
import type { RegisterEvent, SocketHandlerDeps } from "./socket-handler-deps";

export function registerPresenceHandlers(
  registerEvent: RegisterEvent,
  { queryClient, addTypingUser, removeTypingUser, setOnline, setOffline }: SocketHandlerDeps,
): void {
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
}
