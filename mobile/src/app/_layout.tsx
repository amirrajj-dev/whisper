import { Stack } from "expo-router";
import { AppProviders } from "@/providers/app-providers";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import Toast from "react-native-toast-message";
import "../global.css"

function ThemedStatusBar() {
  const colorScheme = useColorScheme();
  return <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />;
}

export default function RootLayout() {
  return (
    <AppProviders>
      <ThemedStatusBar />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="group" />
      </Stack>
      <Toast />
    </AppProviders>
  );
}
