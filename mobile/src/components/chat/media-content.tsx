import { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Play } from "lucide-react-native";
import type { Message } from "@/types/entities/message";
import { ImageLightbox } from "@/components/media/image-lightbox";
import { FileCard } from "@/components/media/file-card";
import { VoiceMessage } from "@/components/chat/voice-message";

interface MediaContentProps {
  message: Message;
  isOwn?: boolean;
}

export function MediaContent({ message, isOwn = false }: MediaContentProps) {
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
        <View className="-mx-1">
          <VoiceMessage uri={message.content} isOwn={isOwn} />
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
