import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Animated, useColorScheme } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { SvgXml } from "react-native-svg";
import { ArrowLeft, MessageCircle, Ban, CheckCircle } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/services/user.api";
import { useAuthStore } from "@/stores/auth.store";
import { useCreateConversation } from "@/hooks/use-chat";
import { Avatar } from "@/components/ui/avatar";
import type { Conversation } from "@/types";
import Toast from "react-native-toast-message";

const BUBBLE_XML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#1a6dff" d="M32 56c-1.08 0-2.05-.56-2.59-1.48l-3.7-6.32c-.76-1.3-2.1-2.18-3.67-2.43C12.47 44.29 5.57 35.92 5.91 26.3 6.37 16.22 15.08 8 25.43 8h13.14c10.35 0 19.06 8.22 19.42 18.31.34 9.61-6.55 17.98-16.03 19.46-1.58.25-2.92 1.13-3.68 2.43l-3.69 6.32c-.55.92-1.52 1.48-2.59 1.48z"/><circle cx="25" cy="25" r="3.5" fill="#fff"/><circle cx="39" cy="25" r="3.5" fill="#fff"/><path fill="#fff" d="M36 30h-8c-.55 0-1 .45-1 1v1c0 2.76 2.24 5 5 5s5-2.24 5-5v-1c0-.55-.45-1-1-1z"/></svg>`;

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { mutate: createConversation } = useCreateConversation();

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(contentTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => userApi.getUserById(id!),
    enabled: !!id,
  });

  const isBlocked = currentUser?.blockedUsers?.includes(id ?? "");

  const { mutate: blockUser, isPending: isBlocking } = useMutation({
    mutationFn: () => userApi.blockUser(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
      Toast.show({ type: "success", text1: "User blocked" });
    },
    onError: (err: { message?: string }) => {
      Toast.show({ type: "error", text1: err.message || "Failed to block user" });
    },
  });

  const { mutate: unblockUser, isPending: isUnblocking } = useMutation({
    mutationFn: () => userApi.unblockUser(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
      Toast.show({ type: "success", text1: "User unblocked" });
    },
    onError: (err: { message?: string }) => {
      Toast.show({ type: "error", text1: err.message || "Failed to unblock user" });
    },
  });

  const handleMessage = () => {
    if (!id) return;
    createConversation(
      { data: { type: "private", participants: [id] } },
      { onSuccess: (result) => {
        const conv = result as Conversation;
        router.push(`/chat/${conv._id}`);
      }},
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-neutral-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <LinearGradient
        colors={isDark ? ["#0a1628", "#0A0A0A"] : ["#eef2ff", "#FFFFFF"]}
        className="flex-1"
      >
        <SvgXml xml={BUBBLE_XML} width={28} height={28} opacity={0.08} style={{ position: "absolute", top: "25%", right: "10%" }} />
        <SvgXml xml={BUBBLE_XML} width={36} height={36} opacity={0.08} style={{ position: "absolute", bottom: "30%", left: "8%" }} />

        <View className="flex-row items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-700" style={{ paddingTop: insets.top + 12 }}>
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <ArrowLeft size={24} color="#3B82F6" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Profile</Text>
        </View>

        <Animated.View
          className="flex-1 px-6"
          style={{
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          }}
        >
          <View className="items-center pt-16 pb-10">
            <View className="relative mb-4">
              <Avatar uri={user?.avatarUrl} name={user?.username || "?"} size={96} />
            </View>
            <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-widest">
              {user?.username}
            </Text>
            {user?.bio && (
              <Text className="text-base text-neutral-500 dark:text-neutral-400 mt-2 text-center leading-6">
                {user.bio}
              </Text>
            )}
          </View>

          <View className="space-y-3">
            <TouchableOpacity
              className="flex-row items-center py-4 px-4 bg-blue-500 rounded-xl"
              onPress={handleMessage}
              activeOpacity={0.85}
            >
              <MessageCircle size={22} color="white" />
              <Text className="text-white font-semibold text-base ml-4">Send Message</Text>
            </TouchableOpacity>

            {isBlocked ? (
              <TouchableOpacity
                className="flex-row items-center py-4 px-4 bg-neutral-100 dark:bg-neutral-800 rounded-xl"
                onPress={() => unblockUser()}
                disabled={isUnblocking}
                activeOpacity={0.85}
              >
                {isUnblocking ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : (
                  <CheckCircle size={22} color="#10B981" />
                )}
                <Text className="text-green-600 font-semibold text-base ml-4">Unblock User</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="flex-row items-center py-4 px-4 bg-red-50 dark:bg-red-950/30 rounded-xl"
                onPress={() => blockUser()}
                disabled={isBlocking}
                activeOpacity={0.85}
              >
                {isBlocking ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Ban size={22} color="#EF4444" />
                )}
                <Text className="text-red-500 font-semibold text-base ml-4">Block User</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
