import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, Animated, Pressable } from "react-native";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  icon,
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 20,
          stiffness: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, fadeAnim, scaleAnim]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Pressable className="flex-1 bg-black/50 items-center justify-center px-8" onPress={onCancel}>
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
            {icon && (
              <View className="items-center mb-5">
                {icon}
              </View>
            )}

            <Text className="text-lg font-bold text-center text-neutral-900 dark:text-neutral-100 mb-2">
              {title}
            </Text>

            <Text className="text-sm text-center text-neutral-500 dark:text-neutral-400 mb-7 leading-5">
              {message}
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 items-center"
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                  {cancelLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 py-3.5 rounded-2xl items-center ${
                  destructive ? "bg-red-500" : "bg-blue-500"
                }`}
                onPress={onConfirm}
                activeOpacity={0.7}
              >
                <Text className="text-sm font-semibold text-white">
                  {confirmLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
