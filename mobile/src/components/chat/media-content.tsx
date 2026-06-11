import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { Play, Pause } from "lucide-react-native";
import type { Message } from "@/types/entities/message";
import { ImageLightbox } from "@/components/media/image-lightbox";
import { FileCard } from "@/components/media/file-card";
import { AVATAR_MAX_SIZE } from "@/constants";

interface MediaContentProps {
  message: Message;
}

export function MediaContent({ message }: MediaContentProps) {
  const [lightboxVisible, setLightboxVisible] = useState(false);

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
        <View>
          <TouchableOpacity onPress={() => setLightboxVisible(true)} className="rounded-xl overflow-hidden">
            <Image
              source={{ uri: message.content }}
              className="rounded-xl"
              style={{ width: 200, height: 200 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <ImageLightbox
            uri={message.content}
            visible={lightboxVisible}
            onClose={() => setLightboxVisible(false)}
          />
        </View>
      );

    case "video":
      return (
        <View className="rounded-xl overflow-hidden bg-black">
          <View className="w-[200px] h-[200px] items-center justify-center">
            <Image
              source={{ uri: message.content }}
              className="w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 items-center justify-center">
              <View className="w-12 h-12 bg-black/50 rounded-full items-center justify-center">
                <Play size={24} color="white" fill="white" />
              </View>
            </View>
          </View>
        </View>
      );

    case "voice":
      return (
        <View className="flex-row items-center gap-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3 min-w-[160px]">
          <TouchableOpacity className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
            <Play size={16} color="white" fill="white" />
          </TouchableOpacity>
          <View className="flex-1 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full">
            <View className="w-1/3 h-full bg-blue-500 rounded-full" />
          </View>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">0:12</Text>
        </View>
      );

    case "file":
      return (
        <FileCard
          uri={message.content}
          name={message.content.split("/").pop() || "file"}
        />
      );

    default:
      return (
        <Text className="text-neutral-900 dark:text-neutral-100 text-base">
          {message.content}
        </Text>
      );
  }
}
