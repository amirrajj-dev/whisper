import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/services/auth.api";
import { userApi } from "@/services/user.api";
import { useAuthStore } from "@/stores/auth.store";
import { secureStorage } from "@/libs/secure-storage";
import type { LoginDto, SignupDto, AuthResponse } from "@/types/dto/auth";
import type { User } from "@/types/entities/user";
import { useRouter } from "expo-router";

function mapAuthUser(user: AuthResponse["user"]): Omit<User, "password"> {
  return {
    _id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    lastSeen: user.createdAt,
    createdAt: user.createdAt,
    updatedAt: user.createdAt,
    blockedUsers: [],
  } as Omit<User, "password">;
}

export function useLogin() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginDto) => authApi.login(data),
    onSuccess: async (response) => {
      await secureStorage.setAccessToken(response.access_token);
      await secureStorage.setRefreshToken(response.refresh_token);
      setUser(mapAuthUser(response.user));
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      router.replace("/(tabs)/chats");
    },
    onError: (error: { message?: string }) => {
      // Toast handled at component level
    },
  });
}

export function useRegister() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: SignupDto) => authApi.register(data),
    onSuccess: async (response) => {
      await secureStorage.setAccessToken(response.access_token);
      await secureStorage.setRefreshToken(response.refresh_token);
      setUser(mapAuthUser(response.user));
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      router.replace("/(tabs)/chats");
    },
    onError: (error: { message?: string }) => {
      // Toast handled at component level
    },
  });
}

export function useLogout() {
  const { logout: storeLogout } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: async () => {
      await secureStorage.clearTokens();
      storeLogout();
      queryClient.clear();
      router.replace("/(auth)/login");
    },
    onError: async () => {
      await secureStorage.clearTokens();
      storeLogout();
      queryClient.clear();
      router.replace("/(auth)/login");
    },
  });
}

export function useDeleteAccount() {
  const { logout: storeLogout } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (password: string) => userApi.deleteMe(password),
    onSuccess: async () => {
      await secureStorage.clearTokens();
      storeLogout();
      queryClient.clear();
      router.replace("/(auth)/login");
    },
    onError: (error: { message?: string }) => {
      // Toast handled at component level
    },
  });
}

export function useCurrentUser() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  return { user, isAuthenticated, isLoading };
}
