import { Tabs } from "expo-router";
import { useAuthStore } from "@/stores/auth.store";
import { useSocket } from "@/hooks/use-socket";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { MessageCircle, Bell, Settings } from "lucide-react-native";

function SocketInitializer() {
  useSocket();
  return null;
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
              <Bell size={size} color={color} />
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
