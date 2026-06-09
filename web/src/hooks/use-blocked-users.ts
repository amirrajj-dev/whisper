'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, type BlockedUser } from '@/src/services/user.api';
import { useAuthStore } from '@/src/stores/auth.store';
import { toast } from 'sonner';

export function useBlockedUsers() {
  return useQuery({
    queryKey: ['blocked-users'],
    queryFn: () => userApi.getBlockedUsers(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userApi.unblockUser(userId),
    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: ['blocked-users'] });
      const previous = queryClient.getQueryData<BlockedUser[]>(['blocked-users']);
      queryClient.setQueryData<BlockedUser[]>(['blocked-users'], (old) =>
        old ? old.filter((u) => u._id !== userId) : [],
      );
      return { previous };
    },
    onSuccess: (_, userId) => {
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        useAuthStore.getState().setUser({
          ...authUser,
          blockedUsers: authUser.blockedUsers.filter((id) => id !== userId),
        });
      }
      toast.success('User unblocked');
    },
    onError: (_err, _userId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['blocked-users'], context.previous);
      }
      toast.error('Failed to unblock user');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
    },
  });
}
