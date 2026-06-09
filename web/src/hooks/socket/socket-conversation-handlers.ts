import type { InfiniteData } from "@tanstack/react-query";
import type { Conversation } from "@/src/types/entities/conversation";
import type {
  ConversationNewPayload,
  ConversationUpdatedPayload,
  ConversationDeletedPayload,
  OwnershipTransferredPayload,
} from "@/src/types/socket/events";
import { socketManager } from "@/src/socket/socket.manager";
import { useChatStore } from "@/src/stores/chat.store";
import type { RegisterEvent, SocketHandlerDeps } from "./socket-handler-deps";

export function registerConversationHandlers(
  registerEvent: RegisterEvent,
  { queryClient }: SocketHandlerDeps,
): void {
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
}
