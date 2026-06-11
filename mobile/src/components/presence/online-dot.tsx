import { View } from "react-native";

interface OnlineDotProps {
  isOnline: boolean;
  size?: number;
}

export function OnlineDot({ isOnline, size = 12 }: OnlineDotProps) {
  if (!isOnline) return null;

  return (
    <View
      className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white dark:border-neutral-950 bg-green-500"
      style={{ width: size, height: size }}
    />
  );
}
