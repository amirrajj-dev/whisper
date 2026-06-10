import type { InfiniteData } from "@tanstack/react-query";
import type { Notification } from "@/types/entities/notification";
import Toast from "react-native-toast-message";
import type { RegisterEvent, SocketHandlerDeps } from "./socket-handler-deps";

export function registerNotificationHandlers(
  registerEvent: RegisterEvent,
  { queryClient, incrementUnread }: SocketHandlerDeps,
): void {
  registerEvent("notification:new", (data) => {
    const payload = data as Record<string, unknown>;
    const notification: Notification = {
      _id: (payload._id as string) || (payload.id as string) || "",
      userId: "",
      type: (payload.type as Notification["type"]) || "system",
      message: (payload.message as string) || "",
      relatedConversation: payload.relatedConversation as string | undefined,
      isRead: (payload.isRead as boolean) || false,
      createdAt: (payload.createdAt as string) || new Date().toISOString(),
      updatedAt: (payload.createdAt as string) || new Date().toISOString(),
    };

    queryClient.setQueryData<
      InfiniteData<{ notifications: Notification[] }>
    >(["notifications"], (old) => {
      if (!old?.pages?.length) {
        return {
          pages: [
            { notifications: [notification], page: 1, totalPages: 1 },
          ],
          pageParams: [1],
        };
      }
      const pages = [...old.pages];
      pages[0] = {
        ...pages[0],
        notifications: [notification, ...pages[0].notifications],
      };
      return { ...old, pages };
    });
    incrementUnread();

    if (notification.message) {
      Toast.show({
        type: "info",
        text1: notification.message,
        visibilityTime: 4000,
      });
    }
  });
}
