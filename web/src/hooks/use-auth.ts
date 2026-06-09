"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/src/services/auth.api";
import { userApi } from "@/src/services/user.api";
import { useAuthStore } from "@/src/stores/auth.store";
import { socketManager } from "@/src/socket/socket.manager";
import type { LoginDto, SignupDto, AuthResponse } from "@/src/types/dto/auth";
import type { User } from "@/src/types/entities/user";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
    onSuccess: (response) => {
      setUser(mapAuthUser(response.user));
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Welcome back!");
      router.push("/app");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Login failed");
    },
  });
}

export function useRegister() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: SignupDto) => authApi.register(data),
    onSuccess: (response) => {
      setUser(mapAuthUser(response.user));
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Account created successfully!");
      router.push("/app");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Registration failed");
    },
  });
}

export function useLogout() {
  const { logout: storeLogout } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      socketManager.fullCleanup();
      storeLogout();
      queryClient.clear();
      router.push("/");
      toast.success("Logged out");
    },
    onError: () => {
      socketManager.fullCleanup();
      storeLogout();
      queryClient.clear();
      router.push("/");
    },
  });
}

export function useDeleteAccount() {
  const { logout: storeLogout } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (password: string) => userApi.deleteMe(password),
    onSuccess: () => {
      socketManager.fullCleanup();
      storeLogout();
      queryClient.clear();
      router.push("/");
      toast.success("Account deleted permanently");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to delete account");
    },
  });
}

export function useCurrentUser() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  return { user, isAuthenticated, isLoading };
}
