export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupDto {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    bio?: string;
    createdAt: string;
  };
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}
