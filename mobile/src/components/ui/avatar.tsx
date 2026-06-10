import { View, Text, Image } from "react-native";
import { getInitials } from "@/utils";

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  className?: string;
}

export function Avatar({ uri, name, size = 40, className = "" }: AvatarProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={`rounded-full ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <View
      className={`rounded-full bg-blue-500 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <Text
        className="text-white font-semibold"
        style={{ fontSize: size * 0.4 }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}
