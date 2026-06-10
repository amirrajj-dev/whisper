import { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, EllipsisVertical } from "lucide-react-native";
import { useMessages, useSendMessage, useConversation } from "@/hooks/use-chat";
import { useAuthStore } from "@/stores/auth.store";
import { useChatStore } from "@/stores/chat.store";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MessageComposer } from "@/components/chat/message-composer";
import { Avatar } from "@/components/ui/avatar";
import { MessageSkeleton } from "@/components/ui/skeleton";
import { OnlineDot } from "@/components/presence/online-dot";
import { usePresenceStore } from "@/stores/presence.store";
import type { PopulatedUser } from "@/types";

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const { setActiveConversation, replyingTo, setReplyingTo, activeConversationId } = useChatStore();
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);

  const { data: messagesData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMessages(id ?? null);
  const { data: conversation } = useConversation(id ?? null);
  const { mutate: sendMessage, isPending } = useSendMessage();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (id) setActiveConversation(id);
    return () => setActiveConversation(null);
  }, [id, setActiveConversation]);

  const participants = (conversation?.participants ?? []) as PopulatedUser[];
  const isGroup = conversation?.type === "group";
  const otherUser = participants?.find((p) => p._id !== currentUser?._id);
  const otherUserId = otherUser?._id;

  const isOtherOnline = otherUserId ? onlineUsers.has(otherUserId) : false;

  const headerName = isGroup ? conversation?.name : otherUser?.username || "Chat";
  const headerAvatar = isGroup ? conversation?.avatarUrl : otherUser?.avatarUrl;

  const messages = (messagesData?.pages.flatMap((p) => p.messages) ?? []).reverse();

  const handleSend = useCallback((content: string) => {
    if (!id) return;
    sendMessage({
      data: {
        conversationId: id,
        type: "text",
        content,
        replyTo: replyingTo?.messageId,
      },
    });
    setReplyingTo(null);
  }, [id, sendMessage, replyingTo, setReplyingTo]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-neutral-950">
        <View className="flex-row items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color="#3B82F6" />
          </TouchableOpacity>
          <View className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <View className="ml-3 flex-1">
            <View className="w-24 h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <View className="w-16 h-3 bg-neutral-200 dark:bg-neutral-700 rounded mt-1" />
          </View>
        </View>
        <View className="flex-1 justify-center items-center">
          <MessageSkeleton />
          <MessageSkeleton />
          <MessageSkeleton />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white dark:bg-neutral-950"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View className="flex-row items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={24} color="#3B82F6" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center flex-1"
          onPress={() => {
            if (isGroup) {
              router.push(`/group/${id}/manage`);
            } else if (otherUser) {
              router.push(`/profile/${otherUser._id}`);
            }
          }}
        >
          <View className="relative">
            <Avatar uri={headerAvatar} name={headerName || "?"} size={40} />
            {!isGroup && <OnlineDot isOnline={isOtherOnline} />}
          </View>
          <View className="ml-3">
            <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {headerName}
            </Text>
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
              {isGroup
                ? `${participants.length} members`
                : isOtherOnline
                  ? "Online"
                  : "Offline"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        className="flex-1"
        data={messages}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingVertical: 8 }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.3}
        initialNumToRender={20}
        renderItem={({ item }) => {
          const senderId = typeof item.senderId === "string" ? item.senderId : item.senderId?._id;
          const isOwn = senderId === currentUser?._id;
          return (
            <MessageBubble
              message={item}
              isOwn={isOwn}
              onLongPress={() => {
                if (isOwn && !item.deleted) {
                  // Message actions would go here
                }
              }}
            />
          );
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-20">
            <Text className="text-neutral-400 dark:text-neutral-500 text-base">
              No messages yet. Start a conversation.
            </Text>
          </View>
        }
      />

      <MessageComposer
        onSend={handleSend}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        disabled={isPending}
      />
    </KeyboardAvoidingView>
  );
}
