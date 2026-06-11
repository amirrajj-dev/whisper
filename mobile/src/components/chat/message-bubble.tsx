import { View, Text, TouchableOpacity } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { MediaContent } from "./media-content";
import type { Message, PopulatedUser } from "@/types";
import { format } from "date-fns";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onLongPress?: () => void;
}

export function MessageBubble({ message, isOwn, onLongPress }: MessageBubbleProps) {
  const sender = message.senderId as PopulatedUser | undefined;
  const senderName = sender?.username || "Unknown";

  return (
    <TouchableOpacity
      className={`flex-row items-end mb-1 px-4 ${isOwn ? "justify-end" : "justify-start"}`}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View className={`max-w-[80%] ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && message.type === "text" && (
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 ml-1">
            {senderName}
          </Text>
        )}
        <View
          className={`${
            message.type === "image" || message.type === "video"
              ? "rounded-xl overflow-hidden"
              : "rounded-2xl px-4 py-2.5"
          } ${
            isOwn
              ? "bg-blue-500 rounded-tr-md"
              : "bg-neutral-100 dark:bg-neutral-800 rounded-tl-md"
          }`}
        >
          {message.replyTo && (
            <View className="border-l-2 border-neutral-400 pl-2 mb-1">
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                {(message.replyTo as { content?: string })?.content || "Reply"}
              </Text>
            </View>
          )}
          <MediaContent message={message} />
          {(message.type !== "image" && message.type !== "video") && (
            <View className="flex-row items-center justify-end mt-0.5 gap-1">
              <Text
                className={`text-[10px] ${
                  isOwn ? "text-white/70" : "text-neutral-400 dark:text-neutral-500"
                }`}
              >
                {format(new Date(message.createdAt), "h:mm a")}
              </Text>
              {isOwn && (
                <Text className="text-[10px] text-white/70">
                  {message.readBy?.length > 0 ? "✓✓" : "✓"}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
