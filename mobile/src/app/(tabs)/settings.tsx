import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Appearance,
  useColorScheme,
  ScrollView,
  TextInput,
} from "react-native";
import { useLogout, useCurrentUser, useDeleteAccount } from "@/hooks/use-auth";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Moon,
  Sun,
  Shield,
  Bell,
  Palette,
  AlertTriangle,
} from "lucide-react-native";
import { Image } from "expo-image";
import { themeStorage } from "@/libs/secure-storage";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export default function SettingsScreen() {
  const { user } = useCurrentUser();
  const { mutate: logout, isPending } = useLogout();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const deleteAccountMutation = useDeleteAccount();

  const toggleTheme = (value: boolean) => {
    const scheme = value ? "dark" : "light";
    Appearance.setColorScheme(scheme);
    themeStorage.set(scheme);
  };

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <View className="px-6 pt-16 pb-4">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Settings
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <TouchableOpacity
          className="flex-row items-center py-4 border-b border-neutral-100 dark:border-neutral-800"
          onPress={() => router.push("/profile")}
        >
          {user?.avatarUrl ? (
            <Image
              style={{ width: 50, height: 50, marginRight: 12, borderRadius: 50 }}
              source={{ uri: user.avatarUrl }}
            />
          ) : (
            <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-4">
              <Text className="text-white font-semibold text-base">
                {user?.username?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-base font-medium text-neutral-900 dark:text-neutral-100">
              {user?.username || "Profile"}
            </Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              {user?.email || ""}
            </Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <View className="mt-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <View className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-xl bg-blue-500/10 items-center justify-center">
              <Palette size={16} color="#3B82F6" />
            </View>
            <View>
              <Text className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                Theme
              </Text>
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                Choose your preferred theme
              </Text>
            </View>
          </View>
          <View className="p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                {isDark ? (
                  <Moon size={20} color="#3B82F6" />
                ) : (
                  <Sun size={20} color="#F59E0B" />
                )}
                <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100 ml-3">
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={isDark ? "#3B82F6" : "#F9FAFB"}
              />
            </View>
          </View>
        </View>

        <View className="mt-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <View className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-xl bg-blue-500/10 items-center justify-center">
              <Bell size={16} color="#3B82F6" />
            </View>
            <View>
              <Text className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                Notifications
              </Text>
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                Manage notification preferences
              </Text>
            </View>
          </View>
          <View className="p-4">
            {[
              { label: "Message notifications", key: "messages" },
              { label: "Group notifications", key: "groups" },
              { label: "Sound", key: "sound" },
            ].map((item, index) => (
              <View
                key={item.key}
                className={`flex-row items-center justify-between py-3 ${
                  index < 2
                    ? "border-b border-neutral-100 dark:border-neutral-800"
                    : ""
                }`}
              >
                <Text className="text-sm text-neutral-900 dark:text-neutral-100">
                  {item.label}
                </Text>
                <Switch
                  value
                  trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                  thumbColor="#3B82F6"
                />
              </View>
            ))}
          </View>
        </View>

        <View className="mt-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <View className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 items-center justify-center">
              <Shield size={16} color="#6B7280" />
            </View>
            <View>
              <Text className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                Security
              </Text>
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                Manage your security settings
              </Text>
            </View>
          </View>
          <View className="p-4">
            {[
              {
                label: "Two-factor authentication",
                action: undefined,
              },
              {
                label: "Active sessions",
                action: undefined,
              },
              {
                label: "Blocked users",
                action: () => router.push("/profile/blocked-users"),
              },
            ].map((item, index) => (
              <TouchableOpacity
                key={item.label}
                className={`flex-row items-center justify-between py-3 ${
                  index < 2
                    ? "border-b border-neutral-100 dark:border-neutral-800"
                    : ""
                }`}
                onPress={item.action}
                disabled={!item.action}
              >
                <Text className="text-sm text-neutral-900 dark:text-neutral-100">
                  {item.label}
                </Text>
                <Text className="text-xs font-medium text-blue-500">Manage</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mt-4 bg-white dark:bg-neutral-900 rounded-2xl border border-red-200 dark:border-red-900/50 overflow-hidden">
          <View className="p-4 border-b border-red-100 dark:border-red-900/50 flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-xl bg-red-500/10 items-center justify-center">
              <AlertTriangle size={16} color="#EF4444" />
            </View>
            <View>
              <Text className="font-semibold text-sm text-red-500">
                Danger Zone
              </Text>
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                Irreversible actions
              </Text>
            </View>
          </View>
          <View className="p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Delete account
                </Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Permanently delete your account and all associated data.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDeleteConfirm(true)}
                className="bg-red-500 px-4 py-2 rounded-xl"
              >
                <Text className="text-white text-sm font-semibold">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="pt-8">
          <TouchableOpacity
            className="w-full bg-red-500 rounded-xl py-3.5 items-center"
            onPress={() => logout()}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Log Out</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showDeleteConfirm}
        title="Delete account"
        message="This will permanently delete your account, messages, and all associated data. Enter your password to confirm."
        confirmLabel="Delete my account"
        destructive
        isLoading={deleteAccountMutation.isPending}
        onConfirm={() => {
          if (deletePassword) {
            deleteAccountMutation.mutate(deletePassword);
            setShowDeleteConfirm(false);
            setDeletePassword("");
          }
        }}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletePassword("");
        }}
      >
        <TextInput
          className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100 mb-1"
          placeholder="Enter your password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={deletePassword}
          onChangeText={setDeletePassword}
          autoFocus
        />
      </ConfirmModal>
    </View>
  );
}
