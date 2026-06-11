import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Switch,
  Appearance,
  useColorScheme,
} from "react-native";
import { useLogout, useCurrentUser } from "@/hooks/use-auth";
import { useBlockedUsers, useUnblockUser } from "@/hooks/use-blocked-users";
import { useRouter } from "expo-router";
import { Ban, CheckCircle, ChevronRight, Moon, Sun } from "lucide-react-native";
import { Avatar } from "@/components/ui/avatar";
import { useState } from "react";
import { Image } from "expo-image";

export default function SettingsScreen() {
  const { user } = useCurrentUser();
  const { mutate: logout, isPending } = useLogout();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === "dark");

  const { data: blockedUsers, isLoading: isLoadingBlocked } = useBlockedUsers();
  const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser();

  const toggleTheme = (value: boolean) => {
    setIsDark(value);
    Appearance.setColorScheme(value ? "dark" : "light");
  };

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <View className="px-6 pt-16 pb-4">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Settings
        </Text>
      </View>

      <FlatList
        className="flex-1"
        data={blockedUsers ?? []}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View className="px-6 space-y-1">
            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-neutral-100 dark:border-neutral-800"
              onPress={() => router.push("/profile")}
            >
              {user?.avatarUrl ? (
                <Image
                style={{width : 50 , height : 50 , marginRight : 12 , borderRadius : 50}}
                source={{ uri: user.avatarUrl }}
                />
              ) : (
                <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-4">
                  <Text className="text-white font-semibold text-base">
                    {user?.username?.charAt(0).toUpperCase() || "?"}
                  </Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                  {user?.username || "Profile"}
                </Text>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                  {user?.email || ""}
                </Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View className="flex-row items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-800">
              <View className="flex-row items-center">
                {isDark ? (
                  <Moon size={22} color="#3B82F6" />
                ) : (
                  <Sun size={22} color="#F59E0B" />
                )}
                <Text className="text-base font-medium text-neutral-900 dark:text-neutral-100 ml-4">
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={isDark ? "#3B82F6" : "#F9FAFB"}
              />
            </View>

            <View className="pt-6 pb-2">
              <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Blocked Users{" "}
                {blockedUsers && blockedUsers.length > 0
                  ? `(${blockedUsers.length})`
                  : ""}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center px-6 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <Avatar uri={item.avatarUrl} name={item.username} size={40} />
            <View className="flex-1 ml-4">
              <Text className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                {item.username}
              </Text>
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                {item.email}
              </Text>
            </View>
            <TouchableOpacity
              className="p-2"
              onPress={() => unblockUser(item._id)}
              disabled={isUnblocking}
            >
              {isUnblocking ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <CheckCircle size={20} color="#10B981" />
              )}
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <View className="px-6 pt-8 pb-12">
            <TouchableOpacity
              className="w-full bg-red-500 rounded-xl py-3.5 items-center"
              onPress={() => logout()}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Log Out
                </Text>
              )}
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
