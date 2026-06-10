import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useRegister } from "@/hooks/use-auth";
import { WhisperLogo } from "@/components/ui/whisper-logo";
import Toast from "react-native-toast-message";

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: register, isPending } = useRegister();

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
      <View className="flex-1 justify-center px-8">
        <View className="mb-10 items-center">
          <WhisperLogo size={80} />
          <Text className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mt-4">
            Create Account
          </Text>
          <Text className="text-neutral-500 dark:text-neutral-400 text-base mt-2">
            Join Whisper and start chatting.
          </Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Username
            </Text>
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
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Email
            </Text>
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
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Password
            </Text>
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
            className="w-full bg-blue-500 rounded-xl py-3.5 items-center mt-2"
            onPress={handleRegister}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-8">
          <Text className="text-neutral-500 dark:text-neutral-400">
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text className="text-blue-500 font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
