export type User = {
  _id: string;
  username: string;
  email: string;
  password: string;
  bio?: string;
  avatarUrl?: string;
  publicId?: string;
  blockedUsers: string[];
  lastSeen: Date;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
};
