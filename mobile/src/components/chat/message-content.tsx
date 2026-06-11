import { View, Text } from "react-native";
import type { Message } from "@/types/entities/message";

interface MessageContentProps {
  message: Message;
}

export function MessageContent({ message }: MessageContentProps) {
  if (message.deleted) {
    return (
      <Text className="text-neutral-400 dark:text-neutral-500 italic text-sm">
        Message deleted
      </Text>
    );
  }

  switch (message.type) {
    case "text":
      return (
        <Text className="text-neutral-900 dark:text-neutral-100 text-base leading-5">
          {message.content}
        </Text>
      );

    case "image":
      return (
        <View className="rounded-xl overflow-hidden">
          <Text className="text-blue-500 font-medium">Image</Text>
        </View>
      );

    case "video":
      return (
        <View className="rounded-xl overflow-hidden">
          <Text className="text-blue-500 font-medium">Video</Text>
        </View>
      );

    case "voice":
      return (
        <View className="flex-row items-center gap-2">
          <Text className="text-blue-500 font-medium">Voice message</Text>
        </View>
      );

    case "file":
      return (
        <View className="flex-row items-center gap-2">
          <Text className="text-blue-500 font-medium">File</Text>
        </View>
      );

    default:
      return (
        <Text className="text-neutral-900 dark:text-neutral-100 text-base">
          {message.content}
        </Text>
      );
  }
}
