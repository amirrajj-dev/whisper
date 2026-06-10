import type { InfiniteData } from "@tanstack/react-query";
import type { Conversation } from "@/types/entities/conversation";

export function getTypingUsername(
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

export function getOtherParticipantIds(
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

export function moveConversationToTop<T extends { conversations: Conversation[] }>(
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
  }) as InfiniteData<T>["pages"];

  if (!moved) return oldData;

  pages[0] = {
    ...pages[0],
    conversations: [moved, ...pages[0].conversations],
  } as T;
  return { ...oldData, pages };
}
