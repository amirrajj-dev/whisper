'use client';

import { motion } from 'framer-motion';
import { UserAvatar } from '@/src/components/common/user-avatar';
import type { Conversation, PopulatedUser } from '@/src/types/entities';
import { useCurrentUser } from '@/src/hooks/use-auth';
import { useChatStore } from '@/src/stores/chat.store';
import { usePresenceStore } from '@/src/stores/presence.store';
import { formatDistanceToNow } from 'date-fns';
import { Hash } from 'lucide-react';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

function getConversationName(conversation: Conversation, currentUserId?: string): string {
  if (conversation.name) return conversation.name;
  const participants = conversation.participants as PopulatedUser[];
  if (participants.length) {
    const other = participants.find((p) => p._id !== currentUserId);
    return other?.username || 'Unknown';
  }
  return 'Unknown';
}

function getConversationAvatar(conversation: Conversation, currentUserId?: string): string | null {
  if (conversation.avatarUrl) return conversation.avatarUrl;
  const participants = conversation.participants as PopulatedUser[];
  if (!conversation.name && participants.length) {
    const other = participants.find((p) => p._id !== currentUserId);
    return other?.avatarUrl || null;
  }
  return null;
}

function getLastMessageTime(lastMessageAt: string): string {
  try {
    return formatDistanceToNow(new Date(lastMessageAt), { addSuffix: true });
  } catch {
    return '';
  }
}

function getOtherParticipant(
  participants: PopulatedUser[],
  currentUserId?: string,
): PopulatedUser | undefined {
  if (!currentUserId) return participants[0];
  return participants.find((p) => p._id !== currentUserId);
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const { user } = useCurrentUser();
  const unreadCount = useChatStore((s) => s.unreadCounts[conversation._id] || 0);
  const isOnline = usePresenceStore((s) => {
    const other = getOtherParticipant(
      conversation.participants as PopulatedUser[],
      user?._id,
    );
    return other ? s.onlineUsers.has(other._id) : false;
  });
  const isGroup = conversation.type === 'group';
  const name = getConversationName(conversation, user?._id);
  const avatar = getConversationAvatar(conversation, user?._id);
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-base-200/80 ${
        isActive ? 'bg-base-200' : ''
      }`}
    >
      <div className="relative shrink-0">
        <UserAvatar
          src={avatar}
          alt={name}
          size="lg"
          isOnline={isOnline}
          showIndicator={!isGroup}
        />
        {isGroup && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
            <Hash className="w-2.5 h-2.5 text-primary-content" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{name}</span>
          {conversation.lastMessageAt && (
            <span className="text-xs text-base-content/40 shrink-0">
              {getLastMessageTime(conversation.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-base-content/60 truncate">
            {isOnline ? (
              <span className="text-success font-medium">Online</span>
            ) : conversation.lastMessage ? (
              conversation.lastMessage
            ) : (
              <span className="text-base-content/30 italic">No messages yet</span>
            )}
          </span>
          {unreadCount > 0 && (
            <span className="badge badge-primary badge-xs shrink-0">{unreadCount}</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
