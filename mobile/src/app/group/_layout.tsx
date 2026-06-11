import { Stack } from "expo-router";

export default function GroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]/manage" />
      <Stack.Screen name="[id]/add-participants" />
    </Stack>
  );
}
