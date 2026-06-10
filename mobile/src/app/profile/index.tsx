import { useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, Save } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/services/user.api";
import { useCurrentUser } from "@/hooks/use-auth";
import { Avatar } from "@/components/ui/avatar";
import { BIO_MAX_LENGTH, USERNAME_MAX_LENGTH } from "@/constants";
import Toast from "react-native-toast-message";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarFile, setAvatarFile] = useState<{ uri: string; name: string; type: string } | null>(null);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: () => {
      const data: { username?: string; bio?: string } = {};
      if (username !== user?.username) data.username = username;
      if (bio !== user?.bio) data.bio = bio;
      const file = avatarFile
        ? { uri: avatarFile.uri, name: avatarFile.name, type: avatarFile.type } as unknown as File
        : undefined;
      return userApi.updateMe(data, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      Toast.show({ type: "success", text1: "Profile updated" });
      router.back();
    },
    onError: (error: { message?: string }) => {
      Toast.show({ type: "error", text1: error.message || "Failed to update profile" });
    },
  });

  const handlePickAvatar = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarFile({
        uri: result.assets[0].uri,
        name: result.assets[0].fileName || "avatar.jpg",
        type: result.assets[0].mimeType || "image/jpeg",
      });
    }
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white dark:bg-neutral-950"
    >
      <View className="flex-row items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ArrowLeft size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex-1">Edit Profile</Text>
        <TouchableOpacity onPress={() => updateProfile()} disabled={isPending} className="flex-row items-center">
          {isPending ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Save size={22} color="#3B82F6" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-8">
        <View className="items-center mb-8">
          <TouchableOpacity className="relative" onPress={handlePickAvatar}>
            <Avatar
              uri={avatarFile?.uri || user?.avatarUrl}
              name={user?.username || "?"}
              size={96}
            />
            <View className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full items-center justify-center border-2 border-white dark:border-neutral-950">
              <Camera size={16} color="white" />
            </View>
          </TouchableOpacity>
          <Text className="text-sm text-blue-500 mt-2 font-medium">Change photo</Text>
        </View>

        <View className="space-y-5">
          <View>
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Username</Text>
            <TextInput
              className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3.5 text-neutral-900 dark:text-neutral-100 text-base"
              placeholder="Username"
              placeholderTextColor="#9CA3AF"
              value={username}
              onChangeText={(t) => t.length <= USERNAME_MAX_LENGTH && setUsername(t)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text className="text-xs text-neutral-400 mt-1 text-right">{username.length}/{USERNAME_MAX_LENGTH}</Text>
          </View>

          <View>
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Bio</Text>
            <TextInput
              className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3.5 text-neutral-900 dark:text-neutral-100 text-base"
              placeholder="Tell us about yourself"
              placeholderTextColor="#9CA3AF"
              value={bio}
              onChangeText={(t) => t.length <= BIO_MAX_LENGTH && setBio(t)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Text className="text-xs text-neutral-400 mt-1 text-right">{bio.length}/{BIO_MAX_LENGTH}</Text>
          </View>

          <View>
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email</Text>
            <TextInput
              className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3.5 text-neutral-400 dark:text-neutral-500 text-base"
              value={user?.email || ""}
              editable={false}
            />
            <Text className="text-xs text-neutral-400 mt-1">Email cannot be changed</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
