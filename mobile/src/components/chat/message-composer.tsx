import { useState, useCallback, useRef } from "react";
import { View, TextInput, TouchableOpacity, Text } from "react-native";
import { Send, Plus } from "lucide-react-native";
import { MESSAGE_MAX_LENGTH } from "@/constants";

interface MessageComposerProps {
  onSend: (content: string) => void;
  replyingTo?: { content: string; senderName: string } | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

export function MessageComposer({ onSend, replyingTo, onCancelReply, disabled }: MessageComposerProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }, [text, disabled, onSend]);

  return (
    <View className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950">
      {replyingTo && (
        <View className="flex-row items-center px-4 py-2 bg-blue-50 dark:bg-blue-950/30">
          <View className="flex-1">
            <Text className="text-xs text-blue-500 font-medium">Replying to {replyingTo.senderName}</Text>
            <Text className="text-sm text-neutral-600 dark:text-neutral-400" numberOfLines={1}>
              {replyingTo.content}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} className="ml-2">
            <Text className="text-neutral-400 text-lg">✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View className="flex-row items-center px-4 py-3 gap-3">
        <TouchableOpacity className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center">
          <Plus size={20} color="#6B7280" />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-4 py-2.5 text-neutral-900 dark:text-neutral-100 text-base max-h-24"
          placeholder="Message..."
          placeholderTextColor="#9CA3AF"
          value={text}
          onChangeText={(t) => t.length <= MESSAGE_MAX_LENGTH && setText(t)}
          multiline
          textAlignVertical="center"
        />

        <TouchableOpacity
          className={`w-9 h-9 rounded-full items-center justify-center ${
            text.trim() ? "bg-blue-500" : "bg-neutral-200 dark:bg-neutral-700"
          }`}
          onPress={handleSend}
          disabled={!text.trim() || disabled}
        >
          <Send size={18} color={text.trim() ? "white" : "#9CA3AF"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
