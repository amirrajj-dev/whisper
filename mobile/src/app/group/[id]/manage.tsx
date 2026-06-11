import { useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Shield, Crown, UserMinus, UserPlus, Trash2, ChevronRight } from "lucide-react-native";
import { useConversation, useRemoveParticipant, usePromoteToAdmin, useDemoteFromAdmin, useTransferOwnership, useDeleteConversation, useUpdateConversation } from "@/hooks/use-chat";
import { useAuthStore } from "@/stores/auth.store";
import { Avatar } from "@/components/ui/avatar";
import { OnlineDot } from "@/components/presence/online-dot";
import { usePresenceStore } from "@/stores/presence.store";
import type { PopulatedUser } from "@/types";
import Toast from "react-native-toast-message";

export default function ManageGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: conversation, isLoading } = useConversation(id ?? null);
  const { mutate: removeParticipant, isPending: isRemoving } = useRemoveParticipant();
  const { mutate: promoteToAdmin, isPending: isPromoting } = usePromoteToAdmin();
  const { mutate: demoteFromAdmin, isPending: isDemoting } = useDemoteFromAdmin();
  const { mutate: transferOwnership } = useTransferOwnership();
  const { mutate: deleteConversation, isPending: isDeleting } = useDeleteConversation();
  const { mutate: updateConversation } = useUpdateConversation();

  const participants = (conversation?.participants as PopulatedUser[]) ?? [];
  const admins = conversation?.admins ?? [];
  const ownerId = conversation?.owner;
  const isOwner = ownerId === currentUser?._id;
  const isAdmin = admins.includes(currentUser?._id ?? "") || isOwner;

  const handlePromote = useCallback((userId: string) => {
    if (!id) return;
    promoteToAdmin({ conversationId: id, userId });
  }, [id, promoteToAdmin]);

  const handleDemote = useCallback((userId: string) => {
    if (!id) return;
    demoteFromAdmin({ conversationId: id, userId });
  }, [id, demoteFromAdmin]);

  const handleRemove = useCallback((userId: string, username: string) => {
    if (!id) return;
    Alert.alert("Remove Member", `Remove ${username} from this group?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeParticipant({ conversationId: id, userId }) },
    ]);
  }, [id, removeParticipant]);

  const handleTransferOwnership = useCallback((userId: string, username: string) => {
    if (!id) return;
    Alert.alert("Transfer Ownership", `Transfer group ownership to ${username}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Transfer", onPress: () => transferOwnership({ conversationId: id, newOwnerId: userId }) },
    ]);
  }, [id, transferOwnership]);

  const handleDeleteGroup = useCallback(() => {
    if (!id) return;
    Alert.alert("Delete Group", "This action cannot be undone. All messages will be lost.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteConversation(id, { onSuccess: () => router.back() }) },
    ]);
  }, [id, deleteConversation, router]);

  const handleSaveName = useCallback(() => {
    if (!id || !newName.trim()) return;
    updateConversation({ id, data: { name: newName.trim() } });
    setEditingName(false);
  }, [id, newName, updateConversation]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-neutral-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white dark:bg-neutral-950"
    >
      <View className="flex-row items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Group Settings</Text>
      </View>

      <FlatList
        className="flex-1"
        data={participants}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <View className="px-6 pt-6 pb-2">
            <View className="items-center mb-6">
              <Avatar uri={conversation?.avatarUrl} name={conversation?.name || "Group"} size={80} />
              {editingName ? (
                <View className="flex-row items-center mt-4 gap-2">
                  <TextInput
                    className="bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-2 text-neutral-900 dark:text-neutral-100 text-base flex-1"
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="Group name"
                    placeholderTextColor="#9CA3AF"
                    autoFocus
                  />
                  <TouchableOpacity onPress={handleSaveName} className="bg-blue-500 rounded-xl px-4 py-2">
                    <Text className="text-white font-semibold">Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => { setNewName(conversation?.name || ""); setEditingName(true); }} className="mt-4">
                  <Text className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{conversation?.name || "Group"}</Text>
                </TouchableOpacity>
              )}
              <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{participants.length} members</Text>
            </View>

            {isOwner && (
              <TouchableOpacity
                className="flex-row items-center py-3 border-b border-neutral-100 dark:border-neutral-800 mb-2"
                onPress={() => router.push(`/group/${id}/add-participants`)}
              >
                <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 items-center justify-center mr-4">
                  <UserPlus size={20} color="#3B82F6" />
                </View>
                <Text className="text-base font-medium text-blue-500">Add Members</Text>
              </TouchableOpacity>
            )}

            <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mt-4 mb-2">
              Members
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isItemOwner = item._id === ownerId;
          const isItemAdmin = admins.includes(item._id);
          const isCurrentUser = item._id === currentUser?._id;
          const isOnline = onlineUsers.has(item._id);

          return (
            <View className="flex-row items-center px-6 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <View className="relative">
                <Avatar uri={item.avatarUrl} name={item.username} size={44} />
                <OnlineDot isOnline={isOnline} size={10} />
              </View>
              <View className="flex-1 ml-4">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                    {item.username}
                  </Text>
                  {isItemOwner && <Crown size={14} color="#F59E0B" />}
                  {isItemAdmin && !isItemOwner && <Shield size={14} color="#3B82F6" />}
                </View>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                  {isItemOwner ? "Owner" : isItemAdmin ? "Admin" : "Member"}
                </Text>
              </View>

              {isAdmin && !isCurrentUser && (
                <View className="flex-row gap-2">
                  {isOwner && !isItemOwner && (
                    <TouchableOpacity
                      className="p-2"
                      onPress={() => handleTransferOwnership(item._id, item.username)}
                    >
                      <Crown size={18} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                  {isOwner && !isItemAdmin && (
                    <TouchableOpacity className="p-2" onPress={() => handlePromote(item._id)}>
                      <Shield size={18} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                  {isOwner && isItemAdmin && !isItemOwner && (
                    <TouchableOpacity className="p-2" onPress={() => handleDemote(item._id)}>
                      <UserMinus size={18} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                  {isOwner && !isItemOwner && (
                    <TouchableOpacity className="p-2" onPress={() => handleRemove(item._id, item.username)}>
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          isOwner ? (
            <View className="px-6 pt-8 pb-12">
              <TouchableOpacity
                className="flex-row items-center justify-center py-4 bg-red-50 dark:bg-red-950/30 rounded-xl"
                onPress={handleDeleteGroup}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#EF4444" />
                ) : (
                  <>
                    <Trash2 size={18} color="#EF4444" />
                    <Text className="text-red-500 font-semibold text-base ml-2">Delete Group</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View className="h-12" />
          )
        }
      />
    </KeyboardAvoidingView>
  );
}
