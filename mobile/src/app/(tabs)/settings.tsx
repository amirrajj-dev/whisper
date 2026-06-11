import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Appearance,
  useColorScheme,
  ScrollView,
} from "react-native";
import { useLogout, useCurrentUser } from "@/hooks/use-auth";
import { useRouter } from "expo-router";
import { Ban, ChevronRight, Moon, Sun, Shield } from "lucide-react-native";
import { Image } from "expo-image";
import { themeStorage } from "@/libs/secure-storage";

export default function SettingsScreen() {
  const { user } = useCurrentUser();
  const { mutate: logout, isPending } = useLogout();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const toggleTheme = (value: boolean) => {
    const scheme = value ? "dark" : "light";
    Appearance.setColorScheme(scheme);
    themeStorage.set(scheme);
  };

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <View className="px-6 pt-16 pb-4">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Settings</Text>
      </View>

      <ScrollView className="flex-1 px-6">
        <TouchableOpacity
          className="flex-row items-center py-4 border-b border-neutral-100 dark:border-neutral-800"
          onPress={() => router.push("/profile")}
        >
          {user?.avatarUrl ? (
            <Image
              style={{ width: 50, height: 50, marginRight: 12, borderRadius: 50 }}
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
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">{user?.email || ""}</Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <View className="flex-row items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-800">
          <View className="flex-row items-center">
            {isDark ? <Moon size={22} color="#3B82F6" /> : <Sun size={22} color="#F59E0B" />}
            <Text className="text-base font-medium text-neutral-900 dark:text-neutral-100 ml-4">Dark Mode</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
            thumbColor={isDark ? "#3B82F6" : "#F9FAFB"}
          />
        </View>

        <TouchableOpacity
          className="flex-row items-center py-4 border-b border-neutral-100 dark:border-neutral-800"
          onPress={() => router.push("/profile/blocked-users")}
        >
          <Shield size={22} color="#EF4444" />
          <Text className="text-base font-medium text-neutral-900 dark:text-neutral-100 ml-4 flex-1">Blocked Users</Text>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <View className="pt-8 pb-12">
          <TouchableOpacity
            className="w-full bg-red-500 rounded-xl py-3.5 items-center"
            onPress={() => logout()}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Log Out</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
