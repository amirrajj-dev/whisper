import { View, Text, TouchableOpacity } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { OnlineDot } from "@/components/presence/online-dot";
import { usePresenceStore } from "@/stores/presence.store";
import { useAuthStore } from "@/stores/auth.store";
import { getMessagePreview } from "@/utils";
import { format } from "date-fns";
import type { Conversation, PopulatedUser } from "@/types";
import { useChatStore } from "@/stores/chat.store";

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
}

const EMPTY_TYPING_USERS: { userId: string; username: string }[] = [];

export function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  const currentUser = useAuthStore((s) => s.user);
  const unreadCount = useChatStore((s) => s.unreadCounts[conversation._id] || 0);
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);
  const typingUsers = useChatStore((s) => s.typingUsers[conversation._id]) || EMPTY_TYPING_USERS;

  const participants = conversation.participants as PopulatedUser[];
  const otherUser = participants?.find((p) => p._id !== currentUser?._id);

  const isGroup = conversation.type === "group";
  const name = isGroup ? conversation.name || "Group" : otherUser?.username || "Unknown";
  const avatarUrl = isGroup ? conversation.avatarUrl : otherUser?.avatarUrl;
  const isOnline = otherUser ? onlineUsers.has(otherUser._id) : false;

  const isTyping = typingUsers.length > 0;

  const getTypingText = () => {
    if (!isGroup) return "typing...";
    const names = typingUsers.map((u) => u.username).filter(Boolean);
    if (names.length === 1) return `${names[0]} typing...`;
    return `${names.length} people are typing...`;
  };

  const time = conversation.lastMessageAt
    ? format(new Date(conversation.lastMessageAt), "h:mm a")
    : "";

  return (
    <TouchableOpacity
      className="flex-row items-center px-6 py-4 border-b border-neutral-100 dark:border-neutral-800"
      onPress={onPress}
    >
      <View className="relative">
        <Avatar uri={avatarUrl} name={name} size={48} />
        {!isGroup && otherUser && <OnlineDot isOnline={isOnline} />}
      </View>

      <View className="flex-1 ml-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex-1 mr-2" numberOfLines={1}>
            {name}
          </Text>
          {time ? (
            <Text className="text-xs text-neutral-400 dark:text-neutral-500">{time}</Text>
          ) : null}
        </View>

        <View className="flex-row items-center justify-between mt-0.5">
          {isTyping ? (
            <View className="flex-row items-center flex-1 mr-2">
              <Text className="text-sm text-blue-500 font-medium" numberOfLines={1}>
                {getTypingText()}
              </Text>
            </View>
          ) : (
            <Text className="text-sm text-neutral-500 dark:text-neutral-400 flex-1 mr-2" numberOfLines={1}>
              {conversation.lastMessage ? getMessagePreview("text", conversation.lastMessage) : "No messages yet"}
            </Text>
          )}
          {unreadCount > 0 && (
            <View className="bg-blue-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
              <Text className="text-white text-[10px] font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
