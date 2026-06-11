import type {
  ParticipantAddedPayload,
  ParticipantRemovedPayload,
  ParticipantRoleChangedPayload,
} from "@/types/socket/events";
import { useChatStore } from "@/stores/chat.store";
import { socketManager } from "./socket.manager";
import type { RegisterEvent, SocketHandlerDeps } from "./socket-handler-deps";

export function registerParticipantHandlers(
  registerEvent: RegisterEvent,
  { queryClient, user }: SocketHandlerDeps,
): void {
  registerEvent("participant:added", (data: ParticipantAddedPayload) => {
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    queryClient.invalidateQueries({
      queryKey: ["conversation", data.conversationId],
    });
  });

  registerEvent("participant:removed", (data: ParticipantRemovedPayload) => {
    queryClient.invalidateQueries({ queryKey: ["conversations"] });

    if (data.removedUserId === user?._id) {
      queryClient.cancelQueries({
        queryKey: ["conversation", data.conversationId],
      });
      queryClient.removeQueries({
        queryKey: ["conversation", data.conversationId],
      });
      socketManager.leaveConversation(data.conversationId);
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
}
