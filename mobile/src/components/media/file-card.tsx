import { View, Text, TouchableOpacity, Linking } from "react-native";
import { FileText, File as FileIcon } from "lucide-react-native";
import { formatFileSize } from "@/utils";

interface FileCardProps {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export function FileCard({ uri, name, size, mimeType }: FileCardProps) {
  const ext = name.split(".").pop()?.toUpperCase() || "FILE";

  const handleOpen = () => {
    Linking.openURL(uri).catch(() => {});
  };

  return (
    <TouchableOpacity
      className="flex-row items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3 max-w-[240px]"
      onPress={handleOpen}
    >
      <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg items-center justify-center">
        <FileText size={20} color="#3B82F6" />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
          {ext} {size ? `· ${formatFileSize(size)}` : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
