import { Stack } from "expo-router";
import { useAuthStore } from "@/stores/auth.store";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="chats" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
