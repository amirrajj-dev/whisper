export interface AuthReturnType {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    bio?: string;
    createdAt: Date;
  };
}
