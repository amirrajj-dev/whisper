import { View, Text } from "react-native";
import { WifiOff } from "lucide-react-native";
import { useNetworkStatus } from "@/hooks/use-network";

export function NetworkBanner() {
  const isConnected = useNetworkStatus();

  if (isConnected) return null;

  return (
    <View className="bg-red-500 px-4 py-2 flex-row items-center justify-center gap-2">
      <WifiOff size={14} color="white" />
      <Text className="text-white text-sm font-medium">No internet connection</Text>
    </View>
  );
}
