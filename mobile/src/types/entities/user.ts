export interface User {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  publicId?: string;
  blockedUsers: string[];
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface PopulatedUser {
  _id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  lastSeen?: string | null;
  isDeleted?: boolean;
}
