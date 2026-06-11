import type { InfiniteData } from "@tanstack/react-query";
import type { Conversation } from "@/types/entities/conversation";
import { useChatStore } from "@/stores/chat.store";
import { socketManager } from "./socket.manager";
import { getOtherParticipantIds } from "./socket-utils";
import type { RegisterEvent, SocketHandlerDeps } from "./socket-handler-deps";

export async function syncConversationRooms(
  conversationsData: InfiniteData<{ conversations: Conversation[] }> | undefined,
  user: { _id: string } | null,
  setOnline: (userId: string) => void,
  fetchAndSetOnline: (userIds: string[]) => Promise<void>,
) {
  if (!user) return;
  setOnline(user._id);

  if (!conversationsData?.pages) return;

  const allConversations = conversationsData.pages.flatMap((p) => p.conversations);
  for (const conv of allConversations) {
    socketManager.joinConversation(conv._id);
  }

  const otherIds = getOtherParticipantIds(conversationsData, user._id);
  if (otherIds.length > 0) {
    await fetchAndSetOnline(otherIds);
  }
}

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

    syncConversationRooms(conversationsData, user, setOnline, fetchAndSetOnline);

    const activeId = useChatStore.getState().activeConversationId;
    if (activeId) {
      socketManager.setViewingConversation(activeId);
      await queryClient.refetchQueries({
        queryKey: ["conversation", activeId],
      });
    }
  });
}
