import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
      <Text className="text-neutral-900 dark:text-neutral-100 text-lg">
        User: {id}
      </Text>
    </View>
  );
}
