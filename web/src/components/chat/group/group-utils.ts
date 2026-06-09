import type { Conversation } from "@/src/types/entities/conversation";
import type { PopulatedUser } from "@/src/types/entities/user";

export type Role = "owner" | "admin" | "member";

export function getParticipantRole(conversation: Conversation, userId: string): Role {
  if (conversation.owner === userId) return "owner";
  if ((conversation.admins ?? []).includes(userId)) return "admin";
  return "member";
}

export function getMembersFromConversation(conversation: Conversation): Array<PopulatedUser & { role: Role }> {
  const participants = conversation.participants as PopulatedUser[];
  return participants.map(p => ({
    ...p,
    role: getParticipantRole(conversation, p._id),
  })).sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, member: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  });
}
