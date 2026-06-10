import { useCallback } from "react";
import { View, Text, TouchableOpacity, RefreshControl } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useConversations, useMessageUnreadCounts } from "@/hooks/use-chat";
import { useChatStore } from "@/stores/chat.store";
import { ConversationItem } from "@/components/chat/conversation-item";
import { ConversationSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function ChatsScreen() {
  const router = useRouter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } = useConversations();
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  useMessageUnreadCounts();

  const conversations = data?.pages.flatMap((p) => p.conversations) ?? [];

  const handleConversationPress = useCallback((conversationId: string) => {
    setActiveConversation(conversationId);
    router.push(`/chat/${conversationId}`);
  }, [setActiveConversation, router]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-neutral-950">
        <View className="px-6 pt-16 pb-4">
          <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Chats</Text>
        </View>
        {Array.from({ length: 8 }).map((_, i) => (
          <ConversationSkeleton key={i} />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <View className="px-6 pt-16 pb-4">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Chats</Text>
      </View>

      <FlashList
        data={conversations}
        keyExtractor={(item) => item._id}
        drawDistance={200}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3B82F6" />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <EmptyState
            title="No conversations yet"
            description="Start a new chat to begin messaging"
          />
        }
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item}
            onPress={() => handleConversationPress(item._id)}
          />
        )}
      />

      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push("/chat/new")}
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}
