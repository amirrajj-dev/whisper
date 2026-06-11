import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, CheckCircle } from "lucide-react-native";
import { useBlockedUsers, useUnblockUser } from "@/hooks/use-blocked-users";
import { Avatar } from "@/components/ui/avatar";

export default function BlockedUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: blockedUsers, isLoading } = useBlockedUsers();
  const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser();

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-row items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-700" style={{ paddingTop: insets.top + 12 }}>
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Blocked Users</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={blockedUsers ?? []}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingVertical: 8 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20">
              <Text className="text-neutral-400 dark:text-neutral-500 text-base">No blocked users</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="flex-row items-center px-6 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <Avatar uri={item.avatarUrl} name={item.username} size={40} />
              <View className="flex-1 ml-4">
                <Text className="text-base font-medium text-neutral-900 dark:text-neutral-100">{item.username}</Text>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">{item.email}</Text>
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
        />
      )}
    </View>
  );
}
