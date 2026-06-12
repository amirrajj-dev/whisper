import { useState, useCallback, useRef, useImperativeHandle } from "react";
import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
} from "react-native";
import { Send, Plus, Mic, StopCircle } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, useAudioRecorderState } from "expo-audio";
import { MESSAGE_MAX_LENGTH, FILE_MAX_SIZE, ACCEPTED_FILE_TYPES } from "@/constants";
import { triggerHaptic } from "@/utils/haptics";
import { getMessagePreview } from "@/utils";
import { PermissionDeniedModal } from "./permission-denied-modal";
import { AttachmentPreview } from "./attachment-preview";

export interface Attachment {
  uri: string;
  type: "image" | "video" | "file" | "voice";
  name?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
}

export interface MessageComposerRef {
  focus: () => void;
  attachSelect: (option: string) => void;
}

interface MessageComposerProps {
  onSend: (content: string, file?: Attachment) => void;
  onTextChange?: () => void;
  replyingTo?: { content: string; senderName: string; type?: string } | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  onAttachPress?: () => void;
}

export const MessageComposer = React.forwardRef(
  function MessageComposer(props: MessageComposerProps, ref: React.Ref<MessageComposerRef>) {
    const { onSend, onTextChange, replyingTo, onCancelReply, disabled, onAttachPress } = props;
    const inputRef = useRef<TextInput>(null);

    const [text, setText] = useState("");
    const [attachment, setAttachment] = useState<Attachment | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [permissionModal, setPermissionModal] = useState<{ visible: boolean; type: "camera" | "photoLibrary" | "microphone" }>({
      visible: false,
      type: "camera",
    });
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const recorderState = useAudioRecorderState(recorder);

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
      const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!result.granted) {
          setPermissionModal({ visible: true, type: "photoLibrary" });
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > FILE_MAX_SIZE) {
          triggerHaptic("error");
          return;
        }
        triggerHaptic("light");
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
      const permission = await ImagePicker.getCameraPermissionsAsync();
      if (!permission.granted) {
        const result = await ImagePicker.requestCameraPermissionsAsync();
        if (!result.granted) {
          setPermissionModal({ visible: true, type: "camera" });
          return;
        }
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        triggerHaptic("light");
        setAttachment({
          uri: result.assets[0].uri,
          type: "image",
          mimeType: result.assets[0].mimeType ?? "image/jpeg",
          fileSize: result.assets[0].fileSize ?? undefined,
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
          triggerHaptic("error");
          return;
        }
        triggerHaptic("light");
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
          setPermissionModal({ visible: true, type: "microphone" });
          return;
        }
        triggerHaptic("medium");
        await recorder.prepareToRecordAsync();
        recorder.record();
        setIsRecording(true);
        setRecordingDuration(0);
      } catch (e) {
        triggerHaptic("error");
      }
    }, [recorder, recorderState]);

    const handleStopRecording = useCallback(async () => {
      try {
        const finalDuration = recorderState.durationMillis / 1000;
        await recorder.stop();
        setIsRecording(false);

        const uri = recorder.uri;
        if (uri) {
          triggerHaptic("success");
          setAttachment({
            uri,
            type: "voice",
            name: "Voice message.m4a",
            mimeType: "audio/m4a",
            fileSize: undefined,
            duration: finalDuration || recordingDuration,
          });
        }
      } catch (e) {
        triggerHaptic("error");
      }
    }, [recorder, recorderState, recordingDuration]);

    const handleAttachSelect = useCallback((option: string) => {
      if (option === "camera") handleTakePhoto();
      else if (option === "library") handlePickImage();
      else if (option === "document") handlePickDocument();
    }, [handleTakePhoto, handlePickImage, handlePickDocument]);

    const handleReRecord = useCallback(async () => {
      setAttachment(null);
      setTimeout(() => {
        handleStartRecording();
      }, 300);
    }, [handleStartRecording]);

    const handleRemoveAttachment = useCallback(() => {
      setAttachment(null);
    }, []);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
      attachSelect: handleAttachSelect,
    }));

    const formatDuration = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return (
      <View className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950">
        {replyingTo && (
          <View className="flex-row items-center px-4 py-2 bg-blue-50 dark:bg-blue-950/30">
            <View className="flex-1">
              <Text className="text-xs text-blue-500 font-medium">Replying to {replyingTo.senderName}</Text>
              <Text className="text-sm text-neutral-600 dark:text-neutral-400" numberOfLines={1}>
                {getMessagePreview(replyingTo.type || "text", replyingTo.content)}
              </Text>
            </View>
            <TouchableOpacity onPress={onCancelReply} className="ml-2">
              <Text className="text-neutral-400 text-lg">✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {attachment && (
          <AttachmentPreview
            attachment={attachment}
            onRemove={handleRemoveAttachment}
            onReRecord={attachment.type === "voice" ? handleReRecord : undefined}
          />
        )}

        {isRecording ? (
          <View className="flex-row items-center px-4 py-3 bg-red-50 dark:bg-red-950/30 gap-3">
            <View className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <Text className="text-sm font-medium text-red-500 flex-1">
              Recording... {formatDuration(recorderState.durationMillis / 1000)}
            </Text>
            <TouchableOpacity
              className="w-9 h-9 rounded-full bg-red-500 items-center justify-center active:bg-red-600"
              onPress={handleStopRecording}
            >
              <StopCircle size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row items-center px-4 py-3 gap-3">
            <TouchableOpacity
              className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center active:bg-neutral-200 dark:active:bg-neutral-700"
              onPress={() => onAttachPress?.()}
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
                className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center active:bg-neutral-200 dark:active:bg-neutral-700"
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

        <PermissionDeniedModal
          visible={permissionModal.visible}
          type={permissionModal.type}
          onClose={() => setPermissionModal({ visible: false, type: "camera" })}
        />
      </View>
    );
  },
);
