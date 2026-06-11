import type { QueryClient } from "@tanstack/react-query";
import type { ServerToClientEvents } from "@/types/socket/events";

export type RegisterEvent = <E extends keyof ServerToClientEvents>(
  event: E,
  handler: ServerToClientEvents[E],
) => void;

export interface SocketHandlerDeps {
  queryClient: QueryClient;
  user: { _id: string } | null;
  addTypingUser: (conversationId: string, user: { userId: string; username: string }) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  incrementConvUnread: (conversationId: string) => void;
  incrementUnread: () => void;
  setOnline: (userId: string) => void;
  setOffline: (userId: string, lastSeen?: string) => void;
  fetchAndSetOnline: (userIds: string[]) => Promise<void>;
}
