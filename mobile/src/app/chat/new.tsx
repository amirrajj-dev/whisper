import { useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Search, MessageCircle, Check, Users, Camera } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/services/user.api";
import { useCreateConversation } from "@/hooks/use-chat";
import { useAuthStore } from "@/stores/auth.store";
import { Avatar } from "@/components/ui/avatar";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import type { User } from "@/types";

type Mode = "private" | "group";

export default function NewChatScreen() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<Mode>("private");
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
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
      if (mode === "private") {
        createConversation(
          { data: { type: "private", participants: [userId] } },
          {
            onSuccess: () => {
              Toast.show({ type: "success", text1: "Conversation created" });
              router.back();
            },
            onError: () => {
              Toast.show({ type: "error", text1: "Failed to create conversation" });
            },
          },
        );
      } else {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(userId)) {
            next.delete(userId);
          } else {
            next.add(userId);
          }
          return next;
        });
      }
    },
    [mode, createConversation, router],
  );

  const handlePickAvatar = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setGroupAvatar(result.assets[0].uri);
    }
  }, []);

  const handleCreateGroup = useCallback(() => {
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      Toast.show({ type: "error", text1: "Please enter a group name" });
      return;
    }
    if (selectedIds.size < 2) {
      Toast.show({ type: "error", text1: "Select at least 2 participants" });
      return;
    }
    const file = groupAvatar
      ? { uri: groupAvatar, name: "avatar.jpg", type: "image/jpeg" } as unknown as File
      : undefined;
    createConversation(
      { data: { type: "group", name: trimmedName, participants: Array.from(selectedIds) }, file },
      {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "Group created" });
          router.back();
        },
        onError: () => {
          Toast.show({ type: "error", text1: "Failed to create group" });
        },
      },
    );
  }, [groupName, selectedIds, groupAvatar, createConversation, router]);

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
          {mode === "private" ? "New Conversation" : "New Group"}
        </Text>
      </View>

      <View className="flex-row px-4 pt-3 pb-2 gap-2">
        <TouchableOpacity
          className={`flex-row items-center px-4 py-2 rounded-full ${
            mode === "private" ? "bg-blue-500" : "bg-neutral-200 dark:bg-neutral-800"
          }`}
          onPress={() => { setMode("private"); setSelectedIds(new Set()); }}
        >
          <MessageCircle size={16} color={mode === "private" ? "white" : "#6B7280"} />
          <Text className={`ml-2 text-sm font-medium ${mode === "private" ? "text-white" : "text-neutral-700 dark:text-neutral-300"}`}>
            New Chat
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-row items-center px-4 py-2 rounded-full ${
            mode === "group" ? "bg-blue-500" : "bg-neutral-200 dark:bg-neutral-800"
          }`}
          onPress={() => { setMode("group"); setSelectedIds(new Set()); }}
        >
          <Users size={16} color={mode === "group" ? "white" : "#6B7280"} />
          <Text className={`ml-2 text-sm font-medium ${mode === "group" ? "text-white" : "text-neutral-700 dark:text-neutral-300"}`}>
            New Group
          </Text>
        </TouchableOpacity>
      </View>

      {mode === "group" && (
        <View className="px-4 pb-3">
          <TouchableOpacity className="self-center mb-3 relative" onPress={handlePickAvatar}>
            <View className="relative">
              <Avatar uri={groupAvatar ?? undefined} name={groupName || "G"} size={64} />
              <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full items-center justify-center border-2 border-white dark:border-neutral-950">
                <Camera size={12} color="white" />
              </View>
            </View>
          </TouchableOpacity>
          <TextInput
            className="bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-2.5 text-neutral-900 dark:text-neutral-100 text-base"
            placeholder="Group name"
            placeholderTextColor="#9CA3AF"
            value={groupName}
            onChangeText={setGroupName}
          />
        </View>
      )}

      <View className="px-4 pb-3">
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

      {mode === "group" && selectedIds.size > 0 && (
        <View className="px-4 pb-2 flex-row flex-wrap gap-2">
          {Array.from(selectedIds).map((id) => {
            const user = users.find((u) => u._id === id);
            if (!user) return null;
            return (
              <View key={id} className="flex-row items-center bg-blue-100 dark:bg-blue-900/40 rounded-full px-3 py-1.5">
                <Text className="text-sm text-blue-700 dark:text-blue-300 mr-1">{user.username}</Text>
                <TouchableOpacity onPress={() => handleUserPress(id)}>
                  <Text className="text-blue-500 text-base">✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

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
          renderItem={({ item }) => {
            const isSelected = selectedIds.has(item._id);
            return (
              <TouchableOpacity
                className="flex-row items-center px-6 py-4 border-b border-neutral-100 dark:border-neutral-800"
                onPress={() => handleUserPress(item._id)}
                disabled={isPending && mode === "private"}
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
                {mode === "group" && (
                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    isSelected ? "bg-blue-500 border-blue-500" : "border-neutral-300 dark:border-neutral-600"
                  }`}>
                    {isSelected && <Check size={14} color="white" />}
                  </View>
                )}
                {isPending && mode === "private" && (
                  <ActivityIndicator size="small" color="#3B82F6" />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {mode === "group" && selectedIds.size >= 2 && (
        <View className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
          <TouchableOpacity
            className="w-full bg-blue-500 rounded-xl py-3.5 items-center"
            onPress={handleCreateGroup}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Create Group ({selectedIds.size} members)
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
