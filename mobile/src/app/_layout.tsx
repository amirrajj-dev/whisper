import { useEffect } from "react";
import { Stack } from "expo-router";
import { AppProviders } from "@/providers/app-providers";
import { StatusBar } from "expo-status-bar";
import { useColorScheme, Appearance } from "react-native";
import { themeStorage } from "@/libs/secure-storage";
import Toast from "react-native-toast-message";
import "../global.css"

function ThemedStatusBar() {
  const colorScheme = useColorScheme();
  return <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />;
}

export default function RootLayout() {
  useEffect(() => {
    themeStorage.get().then((theme) => {
      if (theme) {
        Appearance.setColorScheme(theme);
      }
    });
  }, []);

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
