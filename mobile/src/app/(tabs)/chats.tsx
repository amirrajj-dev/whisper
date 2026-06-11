import { useCallback, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, RefreshControl } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Plus, Search, X } from "lucide-react-native";
import { useConversations, useMessageUnreadCounts } from "@/hooks/use-chat";
import { useChatStore } from "@/stores/chat.store";
import { ConversationItem } from "@/components/chat/conversation-item";
import { ConversationSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { Conversation, PopulatedUser } from "@/types";

function filterConversations(conversations: Conversation[], query: string): Conversation[] {
  if (!query.trim()) return conversations;
  const lower = query.toLowerCase();
  return conversations.filter((c) => {
    if (c.name?.toLowerCase().includes(lower)) return true;
    if (c.lastMessage?.toLowerCase().includes(lower)) return true;
    const participants = c.participants as PopulatedUser[];
    if (participants.some((p) => typeof p === "object" && p.username?.toLowerCase().includes(lower))) return true;
    return false;
  });
}

export default function ChatsScreen() {
  const router = useRouter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } = useConversations();
  const { setActiveConversation, conversationsSearch, setConversationsSearch } = useChatStore();

  useMessageUnreadCounts();

  const conversations = data?.pages.flatMap((p) => p.conversations) ?? [];
  const filtered = useMemo(() => filterConversations(conversations, conversationsSearch), [conversations, conversationsSearch]);

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
      <View className="px-6 pt-16 pb-2">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Chats</Text>
      </View>

      <View className="px-4 pb-3">
        <View className="flex-row items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-2.5">
          <Search size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-neutral-900 dark:text-neutral-100 text-base"
            placeholder="Search conversations..."
            placeholderTextColor="#9CA3AF"
            value={conversationsSearch}
            onChangeText={setConversationsSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {conversationsSearch.length > 0 && (
            <TouchableOpacity onPress={() => setConversationsSearch("")} className="p-1">
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlashList
        data={filtered}
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
          conversationsSearch ? (
            <EmptyState
              title="No results"
              description="No conversations match your search"
            />
          ) : (
            <EmptyState
              title="No conversations yet"
              description="Start a new chat to begin messaging"
            />
          )
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
