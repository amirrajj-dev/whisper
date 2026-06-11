import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'whisper_access_token';
const REFRESH_TOKEN_KEY = 'whisper_refresh_token';

export const secureStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch {
      // SecureStore may be unavailable (web, etc.)
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch {
      // SecureStore may be unavailable
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      // SecureStore may be unavailable
    }
  },
};

const THEME_KEY = "whisper_theme";

let cachedTheme: "light" | "dark" | null = null;

export const themeStorage = {
  async get(): Promise<"light" | "dark" | null> {
    if (cachedTheme) return cachedTheme;
    try {
      const value = await SecureStore.getItemAsync(THEME_KEY);
      cachedTheme = value as "light" | "dark" | null;
      return cachedTheme;
    } catch {
      return null;
    }
  },

  async set(theme: "light" | "dark"): Promise<void> {
    cachedTheme = theme;
    try {
      await SecureStore.setItemAsync(THEME_KEY, theme);
    } catch {}
  },

  getSync(): "light" | "dark" | null {
    return cachedTheme;
  },
};
