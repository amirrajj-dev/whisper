import { View } from "react-native";

interface SkeletonProps {
  className?: string;
  style?: Record<string, unknown>;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <View
      className={`bg-neutral-200 dark:bg-neutral-700 rounded ${className}`}
      style={style}
    />
  );
}

export function ConversationSkeleton() {
  return (
    <View className="flex-row items-center px-6 py-4">
      <Skeleton className="rounded-full" style={{ width: 48, height: 48 }} />
      <View className="flex-1 ml-4 space-y-2">
        <Skeleton style={{ width: "60%", height: 14 }} />
        <Skeleton style={{ width: "80%", height: 12 }} />
      </View>
    </View>
  );
}

export function MessageSkeleton() {
  return (
    <View className="px-4 py-2 items-start">
      <Skeleton style={{ width: "70%", height: 40, borderRadius: 12 }} />
    </View>
  );
}
