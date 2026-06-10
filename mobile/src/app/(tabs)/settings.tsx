import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLogout, useCurrentUser } from "@/hooks/use-auth";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
  const { user } = useCurrentUser();
  const { mutate: logout, isPending } = useLogout();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <View className="px-6 pt-16 pb-4">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Settings
        </Text>
      </View>

      <View className="px-6 space-y-1">
        <TouchableOpacity
          className="flex-row items-center py-4 border-b border-neutral-100 dark:border-neutral-800"
          onPress={() => router.push("/profile")}
        >
          <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-4">
            <Text className="text-white font-semibold text-base">
              {user?.username?.charAt(0).toUpperCase() || "?"}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-medium text-neutral-900 dark:text-neutral-100">
              {user?.username || "Profile"}
            </Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              {user?.email || ""}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className="flex-1" />

      <View className="px-6 pb-8">
        <TouchableOpacity
          className="w-full bg-red-500 rounded-xl py-3.5 items-center"
          onPress={handleLogout}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">Log Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
