import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Modal, Image, Dimensions, Pressable } from "react-native";
import { X, ZoomIn } from "lucide-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ImageLightboxProps {
  uri: string;
  visible: boolean;
  onClose: () => void;
}

export function ImageLightbox({ uri, visible, onClose }: ImageLightboxProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/95 items-center justify-center" onPress={onClose}>
        <TouchableOpacity className="absolute top-14 right-6 z-10" onPress={onClose}>
          <X size={24} color="white" />
        </TouchableOpacity>
        <Image
          source={{ uri }}
          className="rounded-lg"
          style={{ width: SCREEN_WIDTH - 32, height: SCREEN_HEIGHT * 0.6 }}
          resizeMode="contain"
        />
      </Pressable>
    </Modal>
  );
}
