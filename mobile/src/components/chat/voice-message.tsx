import { useCallback } from "react";
import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { Play, Pause } from "lucide-react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

const BAR_COUNT = 28;
const BAR_HEIGHTS = [
  15, 22, 30, 40, 52, 62, 70, 65, 55, 42,
  30, 20, 15, 22, 35, 48, 60, 72, 78, 68,
  55, 38, 25, 16, 20, 35, 50, 62,
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface VoiceMessageProps {
  uri: string;
  isOwn: boolean;
}

export function VoiceMessage({ uri, isOwn }: VoiceMessageProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const duration = status.duration || 0;
  const currentTime = status.currentTime;
  const isPlaying = status.playing;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      if (currentTime >= duration) {
        player.seekTo(0);
      }
      player.play();
    }
  }, [isPlaying, player, currentTime, duration]);

  const handleSeek = useCallback((index: number) => {
    const seekTime = (index / BAR_COUNT) * duration;
    player.seekTo(seekTime);
    if (!isPlaying) {
      player.play();
    }
  }, [player, duration, isPlaying]);

  const inactiveBarColor = isOwn
    ? "rgba(255,255,255,0.3)"
    : (isDark ? "#525252" : "#D4D4D4");

  return (
    <View className="flex-row items-center gap-2.5 min-w-[180px]">
      <TouchableOpacity
        className={`w-9 h-9 rounded-full items-center justify-center ${
          isOwn ? "bg-white/20" : "bg-blue-500"
        }`}
        onPress={handleTogglePlay}
        activeOpacity={0.7}
      >
        {isPlaying ? (
          <Pause size={15} color="white" fill="white" />
        ) : (
          <Play size={15} color="white" fill="white" style={{ marginLeft: 2 }} />
        )}
      </TouchableOpacity>

      <View className="flex-1 gap-1">
        <View className="flex-row items-end h-[30px] gap-[2px]">
          {BAR_HEIGHTS.map((h, i) => {
            const isActive = (i / BAR_COUNT) * 100 <= progress;
            return (
              <TouchableOpacity
                key={i}
                className="flex-1 rounded-sm active:opacity-60"
                onPress={() => handleSeek(i)}
                style={{
                  height: `${h}%`,
                  backgroundColor: isActive
                    ? (isOwn ? "#FFFFFF" : "#3B82F6")
                    : inactiveBarColor,
                  opacity: isPlaying && isActive ? 1 : isActive ? 0.9 : 0.5,
                }}
              />
            );
          })}
        </View>

        <Text
          className={`text-[11px] tabular-nums ${
            isOwn ? "text-white/70" : "text-neutral-500 dark:text-neutral-400"
          }`}
        >
          {formatDuration(isPlaying || currentTime > 0 ? currentTime : duration)}
          {duration > 0 && (
            <Text className={isOwn ? "text-white/40" : "text-neutral-300 dark:text-neutral-600"}>
              {" / "}{formatDuration(duration)}
            </Text>
          )}
        </Text>
      </View>
    </View>
  );
}
