import { api } from '@/libs/axios';
import type { User } from '@/types/entities/user';
import type { UserListResponse, MessageResponse } from '@/types/api/responses';
import type { UpdateUserDto } from '@/types/dto/user';
import type { PaginationDto } from '@/types/dto/pagination';

export interface BlockedUser {
  _id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  lastSeen?: string | null;
  isDeleted?: boolean;
  blockedAt: string;
}

export const userApi = {
  getUsers: (params?: PaginationDto) =>
    api.get<UserListResponse>('/users', { params }).then((r) => r.data),

  getMe: () =>
    api.get<Omit<User, 'password'>>('/users/me').then((r) => r.data),

  getUserById: (id: string) =>
    api.get<Omit<User, 'password'>>(`/users/${id}`).then((r) => r.data),

  updateMe: (data: UpdateUserDto, avatarFile?: File) => {
    const formData = new FormData();
    if (data.username) formData.append('username', data.username);
    if (data.email) formData.append('email', data.email);
    if (data.bio) formData.append('bio', data.bio);
    if (avatarFile) formData.append('avatar', avatarFile);
    return api.put<Omit<User, 'password'>>('/users/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  blockUser: (userId: string) =>
    api.post<{ message: string }>(`/users/${userId}/block`).then((r) => r.data),

  unblockUser: (userId: string) =>
    api.delete<{ message: string }>(`/users/${userId}/block`).then((r) => r.data),

  getBlockedUsers: () =>
    api.get<BlockedUser[]>('/users/me/blocked').then((r) => r.data),

  deleteMe: (password: string) =>
    api.delete<MessageResponse>('/users/me', { data: { password } }).then((r) => r.data),
};
