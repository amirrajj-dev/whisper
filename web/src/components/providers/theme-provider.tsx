"use client";

import { useEffect } from "react";
import { useThemeStore, type Theme } from "@/src/stores/theme-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    const stored = localStorage.getItem("whisper-theme");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const savedTheme = parsed?.state?.theme || parsed;
        if (
          ["light", "dark", "coffee", "night", "forest", "dracula"].includes(
            savedTheme,
          )
        ) {
          setTheme(savedTheme as Theme);
        }
      } catch {
        // stored was not JSON, treat as raw theme value
        if (
          ["light", "dark", "coffee", "night", "forest", "dracula"].includes(
            stored,
          )
        ) {
          setTheme(stored as Theme);
        }
      }
    }
  }, [setTheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(
        "whisper-theme",
        JSON.stringify({ state: { theme }, version: 0 }),
      );
    } catch {
      // localStorage may be unavailable
    }
  }, [theme]);

  return <>{children}</>;
}
