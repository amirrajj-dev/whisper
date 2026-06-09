"use client";

import { formatDistanceToNow } from "date-fns";
import { getParticipantCount } from "./chat-header-utils";
import type { Conversation } from "@/src/types/entities/conversation";

interface ConversationStatusProps {
  conversation: Conversation;
  isGroup: boolean;
  isOnline: boolean;
  otherParticipantLastSeen?: string | null;
  typingUsersList?: Array<{ userId: string; username: string }>;
}

export function ConversationStatus({
  conversation,
  isGroup,
  isOnline,
  otherParticipantLastSeen,
  typingUsersList,
}: ConversationStatusProps) {
  if (typingUsersList?.length) {
    const names = typingUsersList
      .map((u) => u.username)
      .filter(Boolean);
    const text =
      names.length === 1
        ? `${names[0]} is typing...`
        : `${names.length} people are typing...`;
    return <span className="text-success">{text}</span>;
  }

  if (isGroup)
    return <>{getParticipantCount(conversation)} members</>;

  if (isOnline) return <>Online</>;

  if (otherParticipantLastSeen)
    return <>Last seen {formatDistanceToNow(new Date(otherParticipantLastSeen), { addSuffix: true })}</>;

  return null;
}
