import type { InfiniteData } from "@tanstack/react-query";
import type { Conversation } from "@/src/types/entities/conversation";
import { useChatStore } from "@/src/stores/chat.store";
import { socketManager } from "@/src/socket/socket.manager";
import { getOtherParticipantIds } from "./socket-utils";
import type { RegisterEvent, SocketHandlerDeps } from "./socket-handler-deps";

export function registerConnectionHandlers(
  registerEvent: RegisterEvent,
  { queryClient, user, setOnline, fetchAndSetOnline }: SocketHandlerDeps,
): void {
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
        socketManager.setViewingConversation(activeId);
        await queryClient.refetchQueries({
          queryKey: ["conversation", activeId],
        });
      }
    }
  });
}
