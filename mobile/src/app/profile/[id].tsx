import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MessageCircle, Ban, CheckCircle } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/services/user.api";
import { useAuthStore } from "@/stores/auth.store";
import { useCreateConversation } from "@/hooks/use-chat";
import { Avatar } from "@/components/ui/avatar";
import Toast from "react-native-toast-message";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { mutate: createConversation } = useCreateConversation();

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => userApi.getUserById(id!),
    enabled: !!id,
  });

  const isBlocked = currentUser?.blockedUsers?.includes(id ?? "");

  const { mutate: blockUser, isPending: isBlocking } = useMutation({
    mutationFn: () => userApi.blockUser(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      Toast.show({ type: "success", text1: "User blocked" });
    },
    onError: (err: { message?: string }) => {
      Toast.show({ type: "error", text1: err.message || "Failed to block user" });
    },
  });

  const { mutate: unblockUser, isPending: isUnblocking } = useMutation({
    mutationFn: () => userApi.unblockUser(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
      Toast.show({ type: "success", text1: "User unblocked" });
    },
    onError: (err: { message?: string }) => {
      Toast.show({ type: "error", text1: err.message || "Failed to unblock user" });
    },
  });

  const handleMessage = () => {
    if (!id) return;
    createConversation(
      { data: { type: "private", participants: [id] } },
      { onSuccess: () => router.back() },
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-neutral-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-row items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Profile</Text>
      </View>

      <View className="flex-1 px-6 pt-12">
        <View className="items-center mb-10">
          <Avatar uri={user?.avatarUrl} name={user?.username || "?"} size={96} />
          <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-4">
            {user?.username}
          </Text>
          {user?.bio && (
            <Text className="text-base text-neutral-500 dark:text-neutral-400 mt-1 text-center">
              {user.bio}
            </Text>
          )}
        </View>

        <View className="space-y-3">
          <TouchableOpacity
            className="flex-row items-center py-4 px-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl"
            onPress={handleMessage}
          >
            <MessageCircle size={22} color="#3B82F6" />
            <Text className="text-blue-500 font-semibold text-base ml-4">Send Message</Text>
          </TouchableOpacity>

          {isBlocked ? (
            <TouchableOpacity
              className="flex-row items-center py-4 px-4 bg-green-50 dark:bg-green-950/30 rounded-xl"
              onPress={() => unblockUser()}
              disabled={isUnblocking}
            >
              {isUnblocking ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <>
                  <CheckCircle size={22} color="#10B981" />
                  <Text className="text-green-600 font-semibold text-base ml-4">Unblock User</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="flex-row items-center py-4 px-4 bg-red-50 dark:bg-red-950/30 rounded-xl"
              onPress={() => blockUser()}
              disabled={isBlocking}
            >
              {isBlocking ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Ban size={22} color="#EF4444" />
                  <Text className="text-red-500 font-semibold text-base ml-4">Block User</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
