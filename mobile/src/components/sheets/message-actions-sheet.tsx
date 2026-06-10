import { useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { MessageCircle, Edit3, Trash2, Copy } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";

interface MessageActionsSheetProps {
  message: {
    _id: string;
    content: string;
    type: string;
    deleted: boolean;
  } | null;
  isOwn: boolean;
  onReply: (messageId: string, content: string, senderName: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  senderName: string;
}

export interface MessageActionsSheetRef {
  open: () => void;
  close: () => void;
}

export const MessageActionsSheet = forwardRef<MessageActionsSheetRef, MessageActionsSheetProps>(
  ({ message, isOwn, onReply, onEdit, onDelete, senderName }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["auto"], []);

    useImperativeHandle(ref, () => ({
      open: () => bottomSheetRef.current?.snapToIndex(0),
      close: () => bottomSheetRef.current?.close(),
    }));

    const handleCopy = useCallback(async () => {
      if (!message) return;
      await Clipboard.setStringAsync(message.content);
      Toast.show({ type: "success", text1: "Copied to clipboard" });
      bottomSheetRef.current?.close();
    }, [message]);

    const handleReply = useCallback(() => {
      if (!message) return;
      onReply(message._id, message.content, senderName);
      bottomSheetRef.current?.close();
    }, [message, onReply, senderName]);

    const handleEdit = useCallback(() => {
      if (!message) return;
      onEdit(message._id, message.content);
      bottomSheetRef.current?.close();
    }, [message, onEdit]);

    const handleDelete = useCallback(() => {
      if (!message) return;
      onDelete(message._id);
      bottomSheetRef.current?.close();
    }, [message, onDelete]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
      ),
      [],
    );

    if (!message || message.deleted) return null;

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView className="px-6 pb-8">
          <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Message Actions</Text>

          <TouchableOpacity className="flex-row items-center py-3.5 gap-3" onPress={handleReply}>
            <MessageCircle size={20} color="#3B82F6" />
            <Text className="text-base text-neutral-900 dark:text-neutral-100">Reply</Text>
          </TouchableOpacity>

          {message.type === "text" && (
            <TouchableOpacity className="flex-row items-center py-3.5 gap-3" onPress={handleCopy}>
              <Copy size={20} color="#6B7280" />
              <Text className="text-base text-neutral-900 dark:text-neutral-100">Copy Text</Text>
            </TouchableOpacity>
          )}

          {isOwn && (
            <>
              <TouchableOpacity className="flex-row items-center py-3.5 gap-3" onPress={handleEdit}>
                <Edit3 size={20} color="#F59E0B" />
                <Text className="text-base text-neutral-900 dark:text-neutral-100">Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center py-3.5 gap-3" onPress={handleDelete}>
                <Trash2 size={20} color="#EF4444" />
                <Text className="text-base text-red-500">Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

MessageActionsSheet.displayName = "MessageActionsSheet";
