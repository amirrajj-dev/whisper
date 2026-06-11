import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Animated, useColorScheme, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { SvgXml } from "react-native-svg";
import { useRegister } from "@/hooks/use-auth";
import { WhisperLogo } from "@/components/ui/whisper-logo";
import { UserPlus } from "lucide-react-native";
import Toast from "react-native-toast-message";

const BUBBLE_XML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#1a6dff" d="M32 56c-1.08 0-2.05-.56-2.59-1.48l-3.7-6.32c-.76-1.3-2.1-2.18-3.67-2.43C12.47 44.29 5.57 35.92 5.91 26.3 6.37 16.22 15.08 8 25.43 8h13.14c10.35 0 19.06 8.22 19.42 18.31.34 9.61-6.55 17.98-16.03 19.46-1.58.25-2.92 1.13-3.68 2.43l-3.69 6.32c-.55.92-1.52 1.48-2.59 1.48z"/><circle cx="25" cy="25" r="3.5" fill="#fff"/><circle cx="39" cy="25" r="3.5" fill="#fff"/><path fill="#fff" d="M36 30h-8c-.55 0-1 .45-1 1v1c0 2.76 2.24 5 5 5s5-2.24 5-5v-1c0-.55-.45-1-1-1z"/></svg>`;

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: register, isPending } = useRegister();

  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(15)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, damping: 14, stiffness: 100, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(headerTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(formTranslateY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleRegister = () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Toast.show({ type: "error", text1: "Validation", text2: "All fields are required." });
      return;
    }
    register(
      { username: username.trim(), email: email.trim(), password },
      {
        onError: (error: { message?: string }) => {
          Toast.show({
            type: "error",
            text1: "Registration failed",
            text2: error.message || "Please try again.",
          });
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white dark:bg-neutral-950"
    >
      <LinearGradient
        colors={isDark ? ["#0a1628", "#0A0A0A"] : ["#eef2ff", "#FFFFFF"]}
        className="flex-1"
      >
        <SvgXml xml={BUBBLE_XML} width={24} height={24} opacity={0.08} style={{ position: "absolute", top: "20%", right: "12%" }} />
        <SvgXml xml={BUBBLE_XML} width={32} height={32} opacity={0.08} style={{ position: "absolute", bottom: "30%", left: "8%" }} />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-8" style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}>
            <View className="items-center mb-8">
              <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
                <WhisperLogo size={80} />
              </Animated.View>

              <Animated.Text
                className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mt-4 tracking-widest"
                style={{ opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }}
              >
                Create Account
              </Animated.Text>

              <Animated.Text
                className="text-neutral-500 dark:text-neutral-400 text-base mt-2"
                style={{ opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }}
              >
                Join Whisper and start chatting.
              </Animated.Text>
            </View>

            <Animated.View
              className="space-y-4"
              style={{ opacity: formOpacity, transform: [{ translateY: formTranslateY }] }}
            >
              <View>
                <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Username</Text>
                <TextInput
                  className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3.5 text-neutral-900 dark:text-neutral-100 text-base"
                  placeholder="Choose a username"
                  placeholderTextColor="#9CA3AF"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email</Text>
                <TextInput
                  className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3.5 text-neutral-900 dark:text-neutral-100 text-base"
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Password</Text>
                <TextInput
                  className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3.5 text-neutral-900 dark:text-neutral-100 text-base"
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                className="w-full bg-blue-500 rounded-xl py-3.5 items-center flex-row justify-center mt-2"
                onPress={handleRegister}
                disabled={isPending}
                activeOpacity={0.85}
              >
                {isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <UserPlus size={20} color="white" />
                    <Text className="text-white font-semibold text-base ml-3">Create Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View className="flex-row justify-center mt-8">
              <Text className="text-neutral-500 dark:text-neutral-400">Already have an account?{" "}</Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text className="text-blue-500 font-semibold">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
