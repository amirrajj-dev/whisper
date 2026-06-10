import { Stack } from "expo-router";
import { AppProviders } from "@/providers/app-providers";
import { StatusBar } from "expo-status-bar";
import "../global.css"

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="group" />
      </Stack>
    </AppProviders>
  );
}
