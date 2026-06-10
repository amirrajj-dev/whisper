import { useCallback } from "react";
import { View, Text, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Bell, Trash2, CheckCheck } from "lucide-react-native";
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from "@/hooks/use-notifications";
import { useNotificationStore } from "@/stores/notification.store";
import { format } from "date-fns";

export default function NotificationsScreen() {
  const router = useRouter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  useUnreadCount();

  const notifications = data?.pages.flatMap((p) => p.notifications) ?? [];

  const handleNotificationPress = (item: { _id: string; relatedConversation?: string; isRead: boolean }) => {
    if (!item.isRead) {
      markAsRead(item._id);
    }
    if (item.relatedConversation) {
      router.push(`/chat/${item.relatedConversation}`);
    }
  };

  const handleDelete = useCallback((id: string) => {
    Alert.alert("Delete notification", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteNotification(id) },
    ]);
  }, [deleteNotification]);

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-row items-center justify-between px-6 pt-16 pb-4">
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Notifications</Text>
          {unreadCount > 0 && (
            <View className="bg-blue-500 rounded-full px-2 py-0.5">
              <Text className="text-white text-xs font-semibold">{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllAsRead()}>
            <Text className="text-blue-500 text-sm font-medium">Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlashList
        data={notifications}
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
          <View className="flex-1 items-center justify-center pt-20">
            <Bell size={40} color="#9CA3AF" />
            <Text className="text-neutral-400 dark:text-neutral-500 text-base mt-4">No notifications yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            className={`flex-row items-center px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 ${!item.isRead ? "bg-blue-50 dark:bg-blue-950/30" : ""}`}
            onPress={() => handleNotificationPress(item)}
          >
            <View className="flex-1">
              <Text className={`text-sm ${!item.isRead ? "font-semibold text-neutral-900 dark:text-neutral-100" : "text-neutral-700 dark:text-neutral-300"}`}>
                {item.message}
              </Text>
              <Text className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                {format(new Date(item.createdAt), "MMM d, h:mm a")}
              </Text>
            </View>

            <View className="flex-row items-center gap-2 ml-3">
              {!item.isRead && (
                <TouchableOpacity onPress={() => markAsRead(item._id)} className="p-2">
                  <CheckCheck size={18} color="#3B82F6" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => handleDelete(item._id)} className="p-2">
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
