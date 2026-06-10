import { View, Text } from "react-native";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-neutral-400 dark:text-neutral-500 text-lg font-medium">
        {title}
      </Text>
      {description && (
        <Text className="text-neutral-400 dark:text-neutral-500 text-sm mt-2 text-center">
          {description}
        </Text>
      )}
    </View>
  );
}
