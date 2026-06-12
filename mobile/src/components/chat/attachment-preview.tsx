import { View, Text, TouchableOpacity, Image } from "react-native";
import { Image as ImageIcon, Film, FileText, X, Play } from "lucide-react-native";
import { formatFileSize } from "@/utils";
import { VoicePreviewCard } from "./voice-preview-card";

interface Attachment {
  uri: string;
  type: "image" | "video" | "file" | "voice";
  name?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
}

interface AttachmentPreviewProps {
  attachment: Attachment;
  onRemove: () => void;
  onReRecord?: () => void;
}

function getFileExtension(name: string): string {
  const ext = name.split(".").pop()?.toUpperCase() || "FILE";
  return ext;
}

function getFileTypeLabel(ext: string): string {
  const labels: Record<string, string> = {
    PDF: "PDF Document",
    ZIP: "Archive",
    DOC: "Word Document",
    DOCX: "Word Document",
    XLS: "Spreadsheet",
    XLSX: "Spreadsheet",
    TXT: "Text File",
    MP3: "Audio File",
    MP4: "Video File",
    MOV: "Video File",
    WEBM: "Video File",
    JPG: "Image",
    JPEG: "Image",
    PNG: "Image",
    GIF: "Image",
    WEBP: "Image",
  };
  return labels[ext] || `${ext} File`;
}

export function AttachmentPreview({ attachment, onRemove, onReRecord }: AttachmentPreviewProps) {
  if (attachment.type === "image") {
    return (
      <View className="flex-row items-center gap-3 px-4 py-3 bg-neutral-50 dark:bg-neutral-900">
        <View className="relative">
          <Image
            source={{ uri: attachment.uri }}
            className="rounded-xl"
            style={{ width: 56, height: 56 }}
            resizeMode="cover"
          />
          {attachment.fileSize !== undefined && (
            <View className="absolute -bottom-1 -right-1 bg-black/70 rounded-md px-1.5 py-0.5">
              <Text className="text-[10px] text-white font-medium">
                {formatFileSize(attachment.fileSize)}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
            {attachment.name || "Image"}
          </Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            Image · {attachment.fileSize !== undefined ? formatFileSize(attachment.fileSize) : ""}
          </Text>
        </View>
        <TouchableOpacity
          className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 items-center justify-center active:bg-neutral-300 dark:active:bg-neutral-600"
          onPress={onRemove}
          activeOpacity={0.7}
        >
          <X size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
    );
  }

  if (attachment.type === "video") {
    return (
      <View className="flex-row items-center gap-3 px-4 py-3 bg-neutral-50 dark:bg-neutral-900">
        <View className="relative">
          <View className="w-14 h-14 rounded-xl bg-black items-center justify-center">
            <Image
              source={{ uri: attachment.uri }}
              className="w-full h-full rounded-xl"
              resizeMode="cover"
            />
            <View className="absolute inset-0 items-center justify-center">
              <View className="w-7 h-7 rounded-full bg-black/50 items-center justify-center">
                <Play size={14} color="white" fill="white" />
              </View>
            </View>
          </View>
          <View className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
            <Film size={10} color="white" />
          </View>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
            {attachment.name || "Video"}
          </Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            Video · {attachment.fileSize !== undefined ? formatFileSize(attachment.fileSize) : ""}
          </Text>
        </View>
        <TouchableOpacity
          className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 items-center justify-center active:bg-neutral-300 dark:active:bg-neutral-600"
          onPress={onRemove}
          activeOpacity={0.7}
        >
          <X size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
    );
  }

  if (attachment.type === "voice") {
    return (
      <View className="px-4 py-3 bg-neutral-50 dark:bg-neutral-900">
        <VoicePreviewCard
          uri={attachment.uri}
          duration={attachment.duration || 0}
          fileSize={attachment.fileSize}
          onDelete={onRemove}
          onReRecord={onReRecord}
        />
      </View>
    );
  }

  if (attachment.type === "file") {
    const ext = getFileExtension(attachment.name || "file");
    const label = getFileTypeLabel(ext);
    return (
      <View className="flex-row items-center gap-3 px-4 py-3 bg-neutral-50 dark:bg-neutral-900">
        <View className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
          <FileText size={24} color="#3B82F6" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
            {attachment.name || "File"}
          </Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            {ext} · {label}{attachment.fileSize !== undefined ? ` · ${formatFileSize(attachment.fileSize)}` : ""}
          </Text>
        </View>
        <TouchableOpacity
          className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 items-center justify-center active:bg-neutral-300 dark:active:bg-neutral-600"
          onPress={onRemove}
          activeOpacity={0.7}
        >
          <X size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}
