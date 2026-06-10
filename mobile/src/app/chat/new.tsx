import { useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Search, MessageCircle } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/services/user.api";
import { useCreateConversation } from "@/hooks/use-chat";
import { useAuthStore } from "@/stores/auth.store";
import { Avatar } from "@/components/ui/avatar";
import Toast from "react-native-toast-message";

export default function NewChatScreen() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const { mutate: createConversation, isPending } = useCreateConversation();

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users", search],
    queryFn: () => userApi.getUsers({ page: 1, limit: 50 }),
    staleTime: 30 * 1000,
  });

  const users = (usersData?.users ?? []).filter((u) => u._id !== currentUser?._id);

  const filteredUsers = search
    ? users.filter(
        (u) =>
          u.username.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  const handleUserPress = useCallback(
    (userId: string) => {
      createConversation(
        { type: "private", participants: [userId] },
        {
          onSuccess: () => {
            router.back();
          },
        },
      );
    },
    [createConversation, router],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white dark:bg-neutral-950"
    >
      <View className="flex-row items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          New Conversation
        </Text>
      </View>

      <View className="px-4 py-3">
        <View className="flex-row items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-2.5">
          <Search size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-neutral-900 dark:text-neutral-100 text-base"
            placeholder="Search users..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {isLoadingUsers ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20">
              <MessageCircle size={40} color="#9CA3AF" />
              <Text className="text-neutral-400 dark:text-neutral-500 text-base mt-4">
                {search ? "No users found" : "No users available"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row items-center px-6 py-4 border-b border-neutral-100 dark:border-neutral-800"
              onPress={() => handleUserPress(item._id)}
              disabled={isPending}
            >
              <Avatar uri={item.avatarUrl} name={item.username} size={48} />
              <View className="flex-1 ml-4">
                <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {item.username}
                </Text>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                  {item.email}
                </Text>
              </View>
              {isPending && (
                <ActivityIndicator size="small" color="#3B82F6" />
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </KeyboardAvoidingView>
  );
}
