import { useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { View, Text, TouchableOpacity, FlatList, useColorScheme } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { Settings, UserPlus, ChevronRight } from "lucide-react-native";
import { Avatar } from "@/components/ui/avatar";
import { OnlineDot } from "@/components/presence/online-dot";
import type { Conversation, PopulatedUser } from "@/types";
import { useAuthStore } from "@/stores/auth.store";
import { usePresenceStore } from "@/stores/presence.store";

interface GroupInfoSheetProps {
  conversation: Conversation | null;
}

export interface GroupInfoSheetRef {
  open: () => void;
  close: () => void;
}

export const GroupInfoSheet = forwardRef<GroupInfoSheetRef, GroupInfoSheetProps>(
  ({ conversation }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["80%"], []);
    const router = useRouter();
    const currentUser = useAuthStore((s) => s.user);
    const onlineUsers = usePresenceStore((s) => s.onlineUsers);

    useImperativeHandle(ref, () => ({
      open: () => bottomSheetRef.current?.snapToIndex(0),
      close: () => bottomSheetRef.current?.close(),
    }));

    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const participants = (conversation?.participants ?? []) as PopulatedUser[];
    const isGroup = conversation?.type === "group";
    const admins = conversation?.admins ?? [];
    const ownerId = conversation?.owner;
    const isAdmin = admins.includes(currentUser?._id ?? "") || ownerId === currentUser?._id;

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
      ),
      [],
    );

    const handleManageGroup = useCallback(() => {
      bottomSheetRef.current?.close();
      if (conversation) router.push(`/group/${conversation._id}/manage`);
    }, [conversation, router]);

    const handleAddParticipants = useCallback(() => {
      bottomSheetRef.current?.close();
      if (conversation) router.push(`/group/${conversation._id}/add-participants`);
    }, [conversation, router]);

    if (!isGroup || !conversation) return null;

    const displayParticipants = participants.slice(0, 5);
    const remaining = participants.length - 5;

    return (
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          enableDynamicSizing
          backdropComponent={renderBackdrop}
          backgroundStyle={{ backgroundColor: isDark ? "#0A0A0A" : "#FFFFFF" }}
        >
        <BottomSheetView className="px-6 pb-8">
          <View className="items-center mb-6">
            <Avatar uri={conversation.avatarUrl} name={conversation.name || "Group"} size={72} />
            <Text className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-3">{conversation.name}</Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {participants.length} {participants.length === 1 ? "member" : "members"}
            </Text>
          </View>

          <Text className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
            Members
          </Text>

          <FlatList
            data={displayParticipants}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const isOnline = onlineUsers.has(item._id);
              const isOwner = conversation.owner === item._id;
              const isAdmin = (conversation.admins ?? []).includes(item._id);
              const roleLabel = isOwner ? "Owner" : isAdmin ? "Admin" : "";
              return (
                <View className="flex-row items-center py-2.5">
                  <View className="relative">
                    <Avatar uri={item.avatarUrl} name={item.username} size={36} />
                    <OnlineDot isOnline={isOnline} />
                  </View>
                  <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100 ml-3 flex-1">
                    {item.username}
                    {item._id === currentUser?._id && " (You)"}
                  </Text>
                  {roleLabel && (
                    <Text className="text-xs text-neutral-500 dark:text-neutral-400">{roleLabel}</Text>
                  )}
                </View>
              );
            }}
          />

          {remaining > 0 && (
            <Text className="text-xs text-neutral-400 dark:text-neutral-500 text-center mt-1">
              +{remaining} more
            </Text>
          )}

          {isAdmin && (
            <TouchableOpacity
              className="flex-row items-center py-3.5 mt-2 border-t border-neutral-100 dark:border-neutral-800 gap-3"
              onPress={handleManageGroup}
            >
              <Settings size={20} color="#3B82F6" />
              <Text className="text-base text-neutral-900 dark:text-neutral-100 flex-1">Manage Group</Text>
              <ChevronRight size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {isAdmin && (
            <TouchableOpacity
              className="flex-row items-center py-3.5 border-t border-neutral-100 dark:border-neutral-800 gap-3"
              onPress={handleAddParticipants}
            >
              <UserPlus size={20} color="#3B82F6" />
              <Text className="text-base text-neutral-900 dark:text-neutral-100 flex-1">Add Participants</Text>
              <ChevronRight size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

GroupInfoSheet.displayName = "GroupInfoSheet";
