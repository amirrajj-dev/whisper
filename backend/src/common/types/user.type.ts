export type User = {
  _id: string;
  username: string;
  email: string;
  password: string;
  bio?: string;
  avatarUrl?: string;
  blockedUsers: string[];
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
};
