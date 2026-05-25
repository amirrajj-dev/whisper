export type RefreshToken = {
  _id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  ip: string;
  createdAt: Date;
  updatedAt: Date;
};
