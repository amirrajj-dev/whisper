import { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useMessages, useSendMessage, useEditMessage, useDeleteMessage, useConversation } from "@/hooks/use-chat";
import { useAuthStore } from "@/stores/auth.store";
import { useChatStore } from "@/stores/chat.store";
import { socketManager } from "@/hooks/socket/socket.manager";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MessageComposer } from "@/components/chat/message-composer";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { Avatar } from "@/components/ui/avatar";
import { MessageSkeleton } from "@/components/ui/skeleton";
import { OnlineDot } from "@/components/presence/online-dot";
import { usePresenceStore } from "@/stores/presence.store";
import { MessageActionsSheet } from "@/components/sheets/message-actions-sheet";
import { UserProfileSheet } from "@/components/sheets/user-profile-sheet";
import { GroupInfoSheet } from "@/components/sheets/group-info-sheet";
import type { PopulatedUser, Message } from "@/types";

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const { setActiveConversation, replyingTo, setReplyingTo, setEditingMessage, typingUsers } = useChatStore();
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: messagesData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMessages(id ?? null);
  const { data: conversation } = useConversation(id ?? null);
  const { mutate: sendMessage, isPending } = useSendMessage();
  const { mutate: editMessage } = useEditMessage();
  const { mutate: deleteMessage } = useDeleteMessage();

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const messageActionsRef = useRef<{ open: () => void; close: () => void }>(null);
  const userProfileRef = useRef<{ open: () => void; close: () => void }>(null);
  const groupInfoRef = useRef<{ open: () => void; close: () => void }>(null);

  useEffect(() => {
    if (id) {
      setActiveConversation(id);
      socketManager.joinConversation(id);
      socketManager.setViewingConversation(id);
    }
    return () => {
      socketManager.clearViewingConversation();
      setActiveConversation(null);
    };
  }, [id, setActiveConversation]);

  const participants = (conversation?.participants ?? []) as PopulatedUser[];
  const isGroup = conversation?.type === "group";
  const otherUser = participants?.find((p) => p._id !== currentUser?._id);
  const otherUserId = otherUser?._id;

  const isOtherOnline = otherUserId ? onlineUsers.has(otherUserId) : false;

  const headerName = isGroup ? conversation?.name : otherUser?.username || "Chat";
  const headerAvatar = isGroup ? conversation?.avatarUrl : otherUser?.avatarUrl;

  const messages = messagesData?.pages.flatMap((p) => p.messages) ?? [];
  const conversationTypingUsers = id ? typingUsers[id] || [] : [];

  const handleTypingStart = useCallback(() => {
    if (!id) return;
    socketManager.startTyping(id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketManager.stopTyping(id);
    }, 2000);
  }, [id]);

  const handleTypingStop = useCallback(() => {
    if (!id) return;
    socketManager.stopTyping(id);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [id]);

  const handleSend = useCallback((content: string, file?: { uri: string; type: string; name?: string; mimeType?: string }) => {
    if (!id) return;
    handleTypingStop();

    const messageType = file?.type === "image" ? "image"
      : file?.type === "video" ? "video"
      : file?.type === "voice" ? "voice"
      : file?.type === "file" ? "file"
      : "text";

    const fileForUpload = file ? {
      uri: file.uri,
      name: file.name || `file.${file.type}`,
      type: file.mimeType || "application/octet-stream",
    } as unknown as File : undefined;

    sendMessage({
      data: {
        conversationId: id,
        type: messageType,
        content: messageType === "text" ? content : file?.name || file?.type || content,
        replyTo: replyingTo?.messageId,
      },
      file: fileForUpload,
    });
    setReplyingTo(null);
  }, [id, sendMessage, replyingTo, setReplyingTo, handleTypingStop]);

  const handleLongPress = useCallback((message: Message) => {
    setSelectedMessage(message);
    messageActionsRef.current?.open();
  }, []);

  const handleReply = useCallback((messageId: string, content: string, senderName: string) => {
    setReplyingTo({ messageId, content, senderName });
  }, [setReplyingTo]);

  const handleEdit = useCallback((messageId: string, content: string) => {
    setEditingMessage({ messageId, content });
  }, [setEditingMessage]);

  const handleDelete = useCallback((messageId: string) => {
    deleteMessage(messageId);
  }, [deleteMessage]);

  const handleHeaderPress = useCallback(() => {
    if (isGroup) {
      groupInfoRef.current?.open();
    } else if (otherUser) {
      userProfileRef.current?.open();
    }
  }, [isGroup, otherUser]);

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

        <TouchableOpacity className="flex-row items-center flex-1" onPress={handleHeaderPress}>
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

      <FlashList
        data={messages}
        keyExtractor={(item) => item._id}
        drawDistance={300}
        contentContainerStyle={{ paddingVertical: 8 }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          conversationTypingUsers.length > 0 ? (
            <View className="px-4">
              <Text className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                {conversationTypingUsers.map((u) => u.username).join(", ")} typing...
              </Text>
              <TypingIndicator />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const senderId = typeof item.senderId === "string" ? item.senderId : item.senderId?._id;
          const isOwn = senderId === currentUser?._id;
          return (
            <MessageBubble
              message={item}
              isOwn={isOwn}
              onLongPress={() => handleLongPress(item)}
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
        onTextChange={handleTypingStart}
      />

      <MessageActionsSheet
        ref={messageActionsRef}
        message={selectedMessage}
        isOwn={selectedMessage ? (typeof selectedMessage.senderId === "string" ? selectedMessage.senderId : selectedMessage.senderId?._id) === currentUser?._id : false}
        onReply={handleReply}
        onEdit={handleEdit}
        onDelete={handleDelete}
        senderName={selectedMessage ? (typeof selectedMessage.senderId === "object" ? (selectedMessage.senderId as PopulatedUser)?.username : "Unknown") : "Unknown"}
      />

      {!isGroup && <UserProfileSheet ref={userProfileRef} user={otherUser || null} conversationId={id} />}
      {isGroup && <GroupInfoSheet ref={groupInfoRef} conversation={conversation || null} />}
    </KeyboardAvoidingView>
  );
}
