import { Tabs } from "expo-router";
import { useAuthStore } from "@/stores/auth.store";
import { useSocket } from "@/hooks/use-socket";
import { useUnreadCount } from "@/hooks/use-notifications";
import { Redirect } from "expo-router";
import { ActivityIndicator, View, Text, type ColorValue } from "react-native";
import { MessageCircle, Bell, Settings } from "lucide-react-native";
import { useNotificationStore } from "@/stores/notification.store";

function SocketInitializer() {
  useSocket();
  return null;
}

function UnreadCountInitializer() {
  useUnreadCount();
  return null;
}

function BellWithBadge(props: { focused: boolean; color: ColorValue; size: number }) {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  return (
    <View className="relative">
      <Bell size={props.size} color={props.color as string} />
      {unreadCount > 0 && (
        <View className="absolute -top-1 -right-1.5 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1">
          <Text className="text-white text-[9px] font-bold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}

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
    <>
      <SocketInitializer />
      <UnreadCountInitializer />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#3B82F6",
          tabBarInactiveTintColor: "#9CA3AF",
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: "#E5E7EB",
            borderTopWidth: 0.5,
            paddingBottom: 4,
            height: 54,
          },
        }}
      >
        <Tabs.Screen
          name="chats"
          options={{
            title: "Chats",
            tabBarIcon: ({ color, size }) => (
              <MessageCircle size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: "Notifications",
            tabBarIcon: ({ color, size }) => (
              <BellWithBadge focused={false} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Settings size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
