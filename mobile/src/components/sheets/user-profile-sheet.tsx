import { useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, useColorScheme } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { MessageCircle, Ban, ShieldOff, ChevronRight } from "lucide-react-native";
import { Avatar } from "@/components/ui/avatar";
import type { PopulatedUser } from "@/types";
import { format } from "date-fns";
import { usePresenceStore } from "@/stores/presence.store";
import { useBlockedUsers, useBlockUser, useUnblockUser } from "@/hooks/use-blocked-users";
import { OnlineDot } from "@/components/presence/online-dot";

interface UserProfileSheetProps {
  user: PopulatedUser | null;
  conversationId?: string;
  onClose?: () => void;
  onSendMessage?: () => void;
}

export interface UserProfileSheetRef {
  open: () => void;
  close: () => void;
}

export const UserProfileSheet = forwardRef<UserProfileSheetRef, UserProfileSheetProps>(
  ({ user, conversationId, onClose, onSendMessage }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["50%"], []);
    const router = useRouter();
    const onlineUsers = usePresenceStore((s) => s.onlineUsers);
    const { data: blockedUsers } = useBlockedUsers();
    const { mutate: blockUser, isPending: isBlocking } = useBlockUser();
    const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser();

    useImperativeHandle(ref, () => ({
      open: () => bottomSheetRef.current?.snapToIndex(0),
      close: () => bottomSheetRef.current?.close(),
    }));

    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const isOnline = user ? onlineUsers.has(user._id) : false;
    const isBlocked = user ? blockedUsers?.some((b) => b._id === user._id) ?? false : false;

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
      ),
      [],
    );

    const handleSendMessage = useCallback(() => {
      bottomSheetRef.current?.close();
      onSendMessage?.();
    }, [onSendMessage]);

    const handleViewProfile = useCallback(() => {
      bottomSheetRef.current?.close();
      if (user) router.push(`/profile/${user._id}`);
    }, [user, router]);

    if (!user) return null;

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: isDark ? "#0A0A0A" : "#FFFFFF" }}
        onChange={(i) => { if (i === -1) onClose?.(); }}
      >
        <BottomSheetView className="px-6 pb-8">
          <View className="items-center mb-6">
            <View className="relative mb-3">
              <Avatar uri={user.avatarUrl} name={user.username} size={80} />
              <OnlineDot isOnline={isOnline} />
            </View>
            <Text className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{user.username}</Text>
            {user.bio && (
              <Text className="text-sm text-neutral-500 dark:text-neutral-400 text-center mt-1">{user.bio}</Text>
            )}
            <Text className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
              {isOnline ? "Online" : user.lastSeen ? `Last seen ${format(new Date(user.lastSeen), "MMM d, h:mm a")}` : "Offline"}
            </Text>
          </View>

          <TouchableOpacity
            className="flex-row items-center py-3.5 border-t border-neutral-100 dark:border-neutral-800 gap-3"
            onPress={handleSendMessage}
          >
            <MessageCircle size={20} color="#3B82F6" />
            <Text className="text-base text-neutral-900 dark:text-neutral-100 flex-1">Send Message</Text>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center py-3.5 border-t border-neutral-100 dark:border-neutral-800 gap-3"
            onPress={handleViewProfile}
          >
            <ChevronRight size={20} color="#6B7280" />
            <Text className="text-base text-neutral-900 dark:text-neutral-100 flex-1">View Profile</Text>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {isBlocked ? (
            <TouchableOpacity
              className="flex-row items-center py-3.5 border-t border-neutral-100 dark:border-neutral-800 gap-3"
              onPress={() => unblockUser(user._id)}
              disabled={isUnblocking}
            >
              {isUnblocking ? <ActivityIndicator size="small" color="#10B981" /> : <ShieldOff size={20} color="#10B981" />}
              <Text className="text-base text-green-500">Unblock User</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="flex-row items-center py-3.5 border-t border-neutral-100 dark:border-neutral-800 gap-3"
              onPress={() => blockUser(user._id)}
              disabled={isBlocking}
            >
              {isBlocking ? <ActivityIndicator size="small" color="#EF4444" /> : <Ban size={20} color="#EF4444" />}
              <Text className="text-base text-red-500">Block User</Text>
            </TouchableOpacity>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

UserProfileSheet.displayName = "UserProfileSheet";
