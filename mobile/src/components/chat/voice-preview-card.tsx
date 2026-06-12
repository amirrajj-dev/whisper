import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { Play, Pause, Trash2, RotateCcw } from "lucide-react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { formatFileSize } from "@/utils";

interface VoicePreviewCardProps {
  uri: string;
  duration: number;
  fileSize?: number;
  onDelete: () => void;
  onReRecord?: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const BAR_COUNT = 30;
const BAR_HEIGHTS = [
  15, 22, 30, 40, 52, 62, 70, 65, 55, 42,
  30, 20, 15, 22, 35, 48, 60, 72, 78, 68,
  55, 38, 25, 16, 20, 35, 50, 62, 52, 28,
];

export function VoicePreviewCard({ uri, duration: initialDuration, fileSize, onDelete, onReRecord }: VoicePreviewCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const displayDuration = status.duration > 0 ? status.duration : initialDuration;
  const currentTime = status.currentTime;
  const isPlaying = status.playing;
  const progress = displayDuration > 0 ? (currentTime / displayDuration) * 100 : 0;

  const handleTogglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      if (currentTime >= displayDuration) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const handleSeek = (index: number) => {
    const seekTime = (index / BAR_COUNT) * displayDuration;
    player.seekTo(seekTime);
    if (!isPlaying) {
      player.play();
    }
  };

  return (
    <View className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl px-4 py-4 gap-4">
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center active:bg-blue-600"
          onPress={handleTogglePlay}
          activeOpacity={0.7}
        >
          {isPlaying ? (
            <Pause size={18} color="white" fill="white" />
          ) : (
            <Play size={18} color="white" fill="white" style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>

        <View className="flex-1 gap-2">
          <View className="flex-row items-end h-8 gap-[2px]">
            {BAR_HEIGHTS.map((h, i) => {
              const isActive = progress > 0 && (i / BAR_COUNT) * 100 <= progress;
              const isCurrentlyActive = isPlaying && isActive;
              return (
                <TouchableOpacity
                  key={i}
                  className="flex-1 rounded-sm active:opacity-60"
                  onPress={() => handleSeek(i)}
                  style={{
                    height: `${h}%`,
                    backgroundColor: isCurrentlyActive
                      ? "#3B82F6"
                      : isActive
                        ? (isDark ? "#6366F1" : "#3B82F6")
                        : (isDark ? "#525252" : "#D4D4D4"),
                    opacity: isCurrentlyActive ? 1 : isActive ? 0.8 : 0.4,
                  }}
                />
              );
            })}
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-mono tabular-nums text-neutral-500 dark:text-neutral-400">
              {formatDuration(isPlaying || currentTime > 0 ? currentTime : displayDuration)}
              <Text className="text-neutral-300 dark:text-neutral-600">
                {" / "}{formatDuration(displayDuration)}
              </Text>
            </Text>
            {fileSize !== undefined && (
              <Text className="text-xs text-neutral-400 dark:text-neutral-500">
                {formatFileSize(fileSize)}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        {onReRecord && (
          <TouchableOpacity
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700"
            onPress={onReRecord}
            activeOpacity={0.7}
          >
            <RotateCcw size={14} color={isDark ? "#A3A3A3" : "#525252"} />
            <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Re-record
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30"
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Trash2 size={14} color="#EF4444" />
          <Text className="text-xs font-medium text-red-500">
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
