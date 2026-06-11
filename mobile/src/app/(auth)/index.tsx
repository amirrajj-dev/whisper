import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { SvgXml } from "react-native-svg";
import { WhisperLogo } from "@/components/ui/whisper-logo";
import { UserPlus, LogIn, Lock, MessageCircle, Image } from "lucide-react-native";

const BUBBLE_XML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#1a6dff" d="M32 56c-1.08 0-2.05-.56-2.59-1.48l-3.7-6.32c-.76-1.3-2.1-2.18-3.67-2.43C12.47 44.29 5.57 35.92 5.91 26.3 6.37 16.22 15.08 8 25.43 8h13.14c10.35 0 19.06 8.22 19.42 18.31.34 9.61-6.55 17.98-16.03 19.46-1.58.25-2.92 1.13-3.68 2.43l-3.69 6.32c-.55.92-1.52 1.48-2.59 1.48z"/><circle cx="25" cy="25" r="3.5" fill="#fff"/><circle cx="39" cy="25" r="3.5" fill="#fff"/><path fill="#fff" d="M36 30h-8c-.55 0-1 .45-1 1v1c0 2.76 2.24 5 5 5s5-2.24 5-5v-1c0-.55-.45-1-1-1z"/></svg>`;

function FloatingBubble({ size, style: positionStyle, duration = 3000, range = 8 }: { size: number; style: object; duration?: number; range?: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-range, range],
  });

  return (
    <Animated.View style={[positionStyle, { transform: [{ translateY }] }]}>
      <SvgXml xml={BUBBLE_XML} width={size} height={size} opacity={0.12} />
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(15)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(15)).current;
  const featuresOpacity = useRef(new Animated.Value(0)).current;
  const featuresTranslateY = useRef(new Animated.Value(15)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(20)).current;
  const versionOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, damping: 14, stiffness: 100, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(taglineTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(featuresOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(featuresTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(buttonsOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(buttonsTranslateY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(versionOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <LinearGradient
        colors={isDark ? ["#0a1628", "#0A0A0A"] : ["#eef2ff", "#FFFFFF"]}
        className="flex-1"
      >
        <FloatingBubble size={28} range={10} duration={4000} style={{ position: "absolute", top: "15%", left: "10%" }} />
        <FloatingBubble size={36} range={12} duration={5000} style={{ position: "absolute", bottom: "20%", right: "8%" }} />
        <FloatingBubble size={24} range={8} duration={3500} style={{ position: "absolute", top: "55%", right: "15%" }} />

        <View
          className="flex-1 items-center justify-center px-8"
          style={{ paddingTop: insets.top + 40 }}
        >
          <View className="absolute w-48 h-48 bg-blue-500/5 dark:bg-blue-500/10 rounded-full" />

          <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
            <WhisperLogo size={120} />
          </Animated.View>

          <Animated.Text
            className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mt-6 tracking-widest"
            style={{ opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }}
          >
            Whisper
          </Animated.Text>

          <Animated.Text
            className="text-base text-neutral-500 dark:text-neutral-400 mt-3 text-center leading-6"
            style={{ opacity: taglineOpacity, transform: [{ translateY: taglineTranslateY }] }}
          >
            Your space for real conversation.
          </Animated.Text>

          <Animated.View
            className="mt-10 items-start"
            style={{ opacity: featuresOpacity, transform: [{ translateY: featuresTranslateY }] }}
          >
            <View className="flex-row items-center">
              <Lock size={16} color="#A3A3A3" />
              <Text className="text-sm text-neutral-400 ml-3">End-to-end encrypted</Text>
            </View>
            <View className="flex-row items-center mt-3">
              <MessageCircle size={16} color="#A3A3A3" />
              <Text className="text-sm text-neutral-400 ml-3">Private conversations</Text>
            </View>
            <View className="flex-row items-center mt-3">
              <Image size={16} color="#A3A3A3" />
              <Text className="text-sm text-neutral-400 ml-3">Rich media sharing</Text>
            </View>
          </Animated.View>
        </View>
      </LinearGradient>

      <Animated.View
        className="px-8"
        style={{
          opacity: buttonsOpacity,
          transform: [{ translateY: buttonsTranslateY }],
          paddingTop: 20,
          paddingBottom: 8,
        }}
      >
        <TouchableOpacity
          className="w-full bg-blue-500 rounded-xl py-4 items-center flex-row justify-center"
          onPress={() => router.push("/(auth)/register")}
          activeOpacity={0.85}
        >
          <UserPlus size={20} color="white" />
          <Text className="text-white font-semibold text-base ml-3">Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl py-4 items-center flex-row justify-center mt-3"
          onPress={() => router.push("/(auth)/login")}
          activeOpacity={0.85}
        >
          <LogIn size={20} color="#9CA3AF" />
          <Text className="text-neutral-900 dark:text-neutral-100 font-semibold text-base ml-3">Sign In</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.Text
        className="text-center text-xs text-neutral-400"
        style={{
          opacity: versionOpacity,
          paddingBottom: insets.bottom + 16,
          paddingTop: 12,
        }}
      >
        Whisper v1.0
      </Animated.Text>
    </View>
  );
}
