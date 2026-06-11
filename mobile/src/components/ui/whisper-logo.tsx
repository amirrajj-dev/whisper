import { View } from "react-native";
import { SvgXml } from "react-native-svg";

const SVG_XML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#1a6dff" d="M32 56c-1.08 0-2.05-.56-2.59-1.48l-3.7-6.32c-.76-1.3-2.1-2.18-3.67-2.43C12.47 44.29 5.57 35.92 5.91 26.3 6.37 16.22 15.08 8 25.43 8h13.14c10.35 0 19.06 8.22 19.42 18.31.34 9.61-6.55 17.98-16.03 19.46-1.58.25-2.92 1.13-3.68 2.43l-3.69 6.32c-.55.92-1.52 1.48-2.59 1.48z"/><circle cx="25" cy="25" r="3.5" fill="#fff"/><circle cx="39" cy="25" r="3.5" fill="#fff"/><path fill="#fff" d="M36 30h-8c-.55 0-1 .45-1 1v1c0 2.76 2.24 5 5 5s5-2.24 5-5v-1c0-.55-.45-1-1-1z"/></svg>`;

interface WhisperLogoProps {
  size?: number;
}

export function WhisperLogo({ size = 64 }: WhisperLogoProps) {
  return (
    <View style={{ width: size, height: size }}>
      <SvgXml xml={SVG_XML} width={size} height={size} />
    </View>
  );
}
