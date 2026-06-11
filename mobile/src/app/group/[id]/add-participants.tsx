import { useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Search, Check, UserPlus } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/services/user.api";
import { useConversation, useAddParticipants } from "@/hooks/use-chat";
import { useAuthStore } from "@/stores/auth.store";
import { Avatar } from "@/components/ui/avatar";
import type { PopulatedUser } from "@/types";

export default function AddParticipantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: conversation } = useConversation(id ?? null);
  const { mutate: addParticipants, isPending } = useAddParticipants();

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users", search],
    queryFn: () => userApi.getUsers({ page: 1, limit: 50 }),
    staleTime: 30 * 1000,
  });

  const existingParticipantIds = new Set(
    ((conversation?.participants as PopulatedUser[]) ?? []).map((p) => p._id)
  );

  const users = (usersData?.users ?? [])
    .filter((u) => u._id !== currentUser?._id && !existingParticipantIds.has(u._id));

  const filteredUsers = search
    ? users.filter(
        (u) =>
          u.username.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  const toggleUser = useCallback((userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const handleAdd = useCallback(() => {
    if (!id || selectedIds.size === 0) return;
    addParticipants(
      { conversationId: id, userIds: Array.from(selectedIds) },
      { onSuccess: () => router.back() },
    );
  }, [id, selectedIds, addParticipants, router]);

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-row items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex-1">Add Members</Text>
        {selectedIds.size > 0 && (
          <TouchableOpacity onPress={handleAdd} disabled={isPending} className="flex-row items-center">
            {isPending ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Text className="text-blue-500 font-semibold">Add ({selectedIds.size})</Text>
            )}
          </TouchableOpacity>
        )}
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
              <UserPlus size={40} color="#9CA3AF" />
              <Text className="text-neutral-400 dark:text-neutral-500 text-base mt-4">
                {search ? "No users found" : "No users to add"}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selectedIds.has(item._id);
            return (
              <TouchableOpacity
                className="flex-row items-center px-6 py-4 border-b border-neutral-100 dark:border-neutral-800"
                onPress={() => toggleUser(item._id)}
              >
                <Avatar uri={item.avatarUrl} name={item.username} size={44} />
                <View className="flex-1 ml-4">
                  <Text className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                    {item.username}
                  </Text>
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400">{item.email}</Text>
                </View>
                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                  isSelected ? "bg-blue-500 border-blue-500" : "border-neutral-300 dark:border-neutral-600"
                }`}>
                  {isSelected && <Check size={14} color="white" />}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
