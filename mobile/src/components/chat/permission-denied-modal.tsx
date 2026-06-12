import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, Animated, Pressable, Linking, Platform } from "react-native";
import { AlertTriangle, Camera, Image, Mic, Settings } from "lucide-react-native";

type PermissionType = "camera" | "photoLibrary" | "microphone";

interface PermissionInfo {
  icon: typeof Camera;
  title: string;
  description: string;
  why: string;
}

const permissionInfo: Record<PermissionType, PermissionInfo> = {
  camera: {
    icon: Camera,
    title: "Camera Access Required",
    description: "You haven't granted Whisper access to your camera.",
    why: "Whisper needs camera access to let you take photos and share them instantly in your conversations.",
  },
  photoLibrary: {
    icon: Image,
    title: "Photo Library Access Required",
    description: "You haven't granted Whisper access to your photo library.",
    why: "Whisper needs photo library access so you can browse and share photos and videos from your gallery.",
  },
  microphone: {
    icon: Mic,
    title: "Microphone Access Required",
    description: "You haven't granted Whisper access to your microphone.",
    why: "Whisper needs microphone access to let you record and send voice messages to your conversations.",
  },
};

interface PermissionDeniedModalProps {
  visible: boolean;
  type: PermissionType;
  onClose: () => void;
}

export function PermissionDeniedModal({ visible, type, onClose }: PermissionDeniedModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const info = permissionInfo[type];
  const Icon = info.icon;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, damping: 22, stiffness: 350, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleOpenSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.openSettings();
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 items-center justify-center px-8" onPress={onClose}>
        <Animated.View
          className="w-full bg-white dark:bg-neutral-900 rounded-3xl px-6 pt-8 pb-6 shadow-2xl"
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.25,
            shadowRadius: 40,
            elevation: 20,
          }}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="items-center mb-5">
              <View className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 items-center justify-center mb-4">
                <AlertTriangle size={28} color="#F59E0B" />
              </View>
              <View className="flex-row items-center gap-3 mb-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl px-4 py-3 w-full">
                <View className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                  <Icon size={22} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {info.title.split(" Required")[0]}
                  </Text>
                  <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Feature blocked
                  </Text>
                </View>
              </View>
            </View>

            <Text className="text-lg font-bold text-center text-neutral-900 dark:text-neutral-100 mb-2">
              {info.title}
            </Text>

            <Text className="text-sm text-center text-neutral-500 dark:text-neutral-400 mb-4 leading-5">
              {info.description}
            </Text>

            <View className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl px-4 py-3.5 mb-6">
              <Text className="text-xs text-neutral-500 dark:text-neutral-400 leading-5">
                {info.why}
              </Text>
            </View>

            <View className="gap-3">
              <TouchableOpacity
                className="flex-row items-center justify-center py-3.5 rounded-2xl bg-blue-500 active:bg-blue-600 gap-2"
                onPress={handleOpenSettings}
                activeOpacity={0.7}
              >
                <Settings size={18} color="white" />
                <Text className="text-sm font-semibold text-white">
                  Open Settings
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="py-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 items-center"
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
