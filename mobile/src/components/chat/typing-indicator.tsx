import { View, Text } from "react-native";

export function TypingIndicator() {
  return (
    <View className="flex-row items-center px-4 py-2">
      <View className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-4 py-2.5 flex-row items-center gap-1">
        <View className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce" />
        <View className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: "150ms" }} />
        <View className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce" style={{ animationDelay: "300ms" }} />
      </View>
    </View>
  );
}
