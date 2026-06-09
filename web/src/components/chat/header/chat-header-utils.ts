import type { Conversation } from "@/src/types/entities/conversation";
import type { PopulatedUser } from "@/src/types/entities/user";

export function getConversationName(
  conversation: Conversation,
  currentUserId?: string,
): string {
  if (conversation.name) return conversation.name;
  const participants = conversation.participants as PopulatedUser[];
  if (participants.length) {
    const other = participants.find((p) => p._id !== currentUserId);
    return other?.username || "Unknown";
  }
  return "Unknown";
}

export function getConversationAvatar(
  conversation: Conversation,
  currentUserId?: string,
): string | null {
  if (conversation.avatarUrl) return conversation.avatarUrl;
  const participants = conversation.participants as PopulatedUser[];
  if (!conversation.name && participants.length) {
    const other = participants.find((p) => p._id !== currentUserId);
    return other?.avatarUrl || null;
  }
  return null;
}

export function getParticipantCount(conversation: Conversation): number {
  return (conversation.participants as PopulatedUser[]).length;
}
