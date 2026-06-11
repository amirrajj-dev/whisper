import { useState, useCallback, useRef, useEffect, useImperativeHandle } from "react";
import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActionSheetIOS,
  Platform,
  Alert,
} from "react-native";
import { Send, Plus, Image as ImageIcon, Camera, FileText, Mic, StopCircle } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from "expo-audio";
import { MESSAGE_MAX_LENGTH, FILE_MAX_SIZE, ACCEPTED_FILE_TYPES } from "@/constants";

interface Attachment {
  uri: string;
  type: "image" | "video" | "file" | "voice";
  name?: string;
  mimeType?: string;
  fileSize?: number;
}

export interface MessageComposerRef {
  focus: () => void;
}

interface MessageComposerProps {
  onSend: (content: string, file?: Attachment) => void;
  onTextChange?: () => void;
  replyingTo?: { content: string; senderName: string } | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

export const MessageComposer = React.forwardRef(
  function MessageComposer(props: MessageComposerProps, ref: React.Ref<MessageComposerRef>) {
    const { onSend, onTextChange, replyingTo, onCancelReply, disabled } = props;
    const inputRef = useRef<TextInput>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleChangeText = useCallback((t: string) => {
    if (t.length > MESSAGE_MAX_LENGTH) return;
    setText(t);
    if (t.length > 0) onTextChange?.();
  }, [onTextChange]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if ((!trimmed && !attachment) || disabled) return;
    onSend(trimmed, attachment ?? undefined);
    setText("");
    setAttachment(null);
  }, [text, disabled, onSend, attachment]);

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > FILE_MAX_SIZE) {
        Alert.alert("File too large", "Maximum file size is 10MB.");
        return;
      }
      setAttachment({
        uri: asset.uri,
        type: asset.type === "video" ? "video" : "image",
        name: asset.fileName ?? undefined,
        mimeType: asset.mimeType ?? undefined,
        fileSize: asset.fileSize ?? undefined,
      });
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission required");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setAttachment({
        uri: result.assets[0].uri,
        type: "image",
      });
    }
  }, []);

  const handlePickDocument = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ACCEPTED_FILE_TYPES,
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.size && asset.size > FILE_MAX_SIZE) {
        Alert.alert("File too large", "Maximum file size is 10MB.");
        return;
      }
      setAttachment({
        uri: asset.uri,
        type: "file",
        name: asset.name,
        mimeType: asset.mimeType,
        fileSize: asset.size,
      });
    }
  }, []);

  const handleStartRecording = useCallback(async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission required", "Microphone access is needed to record voice.");
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(recorder.currentTime);
      }, 500);
    } catch (e) {
      Alert.alert("Recording failed", "Could not start recording.");
    }
  }, [recorder]);

  const handleStopRecording = useCallback(async () => {
    try {
      await recorder.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);

      const uri = recorder.uri;
      if (uri) {
        setAttachment({
          uri,
          type: "voice",
          name: "Voice message.m4a",
          mimeType: "audio/m4a",
          fileSize: undefined,
        });
      }
    } catch (e) {
      Alert.alert("Error", "Could not stop recording.");
    }
  }, [recorder]);

  const handleAttachPress = useCallback(() => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Camera", "Photo Library", "Document"],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) handleTakePhoto();
          else if (index === 2) handlePickImage();
          else if (index === 3) handlePickDocument();
        },
      );
    } else {
      Alert.alert("Attach", "Choose an option", [
        { text: "Camera", onPress: handleTakePhoto },
        { text: "Photo Library", onPress: handlePickImage },
        { text: "Document", onPress: handlePickDocument },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }, [handleTakePhoto, handlePickImage, handlePickDocument]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

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

      {attachment && (
        <View className="flex-row items-center px-4 py-2 bg-neutral-50 dark:bg-neutral-900">
          <View className="flex-row items-center flex-1 gap-2">
            {attachment.type === "image" && <ImageIcon size={18} color="#3B82F6" />}
            {attachment.type === "video" && <Camera size={18} color="#3B82F6" />}
            {attachment.type === "file" && <FileText size={18} color="#3B82F6" />}
            {attachment.type === "voice" && <Mic size={18} color="#3B82F6" />}
            <Text className="text-sm text-neutral-600 dark:text-neutral-400 flex-1" numberOfLines={1}>
              {attachment.name || `${attachment.type} attachment`}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setAttachment(null)}>
            <Text className="text-neutral-400 text-lg">✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {isRecording ? (
        <View className="flex-row items-center px-4 py-3 bg-red-50 dark:bg-red-950/30 gap-3">
          <View className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <Text className="text-sm font-medium text-red-500 flex-1">
            Recording... {formatDuration(recordingDuration)}
          </Text>
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-red-500 items-center justify-center"
            onPress={handleStopRecording}
          >
            <StopCircle size={20} color="white" />
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-row items-center px-4 py-3 gap-3">
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center"
            onPress={handleAttachPress}
          >
            <Plus size={20} color="#6B7280" />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-4 py-2.5 text-neutral-900 dark:text-neutral-100 text-base max-h-24"
            placeholder="Message..."
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={handleChangeText}
            multiline
            textAlignVertical="center"
          />

          {!text.trim() && !attachment ? (
            <TouchableOpacity
              className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center"
              onPress={handleStartRecording}
            >
              <Mic size={18} color="#EF4444" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className={`w-9 h-9 rounded-full items-center justify-center ${
                text.trim() || attachment ? "bg-blue-500" : "bg-neutral-200 dark:bg-neutral-700"
              }`}
              onPress={handleSend}
              disabled={(!text.trim() && !attachment) || disabled}
            >
              <Send size={18} color={text.trim() || attachment ? "white" : "#9CA3AF"} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
});
