"use client";

import {
  useThemeStore,
  type Theme,
  themeNames,
} from "@/src/stores/theme-store";
import { Palette, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

export function ThemePicker() {
  const { theme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const themes: Theme[] = [
    "light",
    "dark",
    "coffee",
    "night",
    "forest",
    "dracula",
  ];

  return (
    <div ref={ref} className="relative z-100">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-circle"
        aria-label="Toggle theme picker"
      >
        <Palette className="w-5 h-5" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-44 bg-base-200 rounded-xl shadow-2xl border border-base-300 overflow-hidden z-50"
          >
            {themes.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTheme(t);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-base-300 ${
                  theme === t ? "text-primary font-medium" : "text-base-content"
                }`}
              >
                <span className="capitalize">{themeNames[t]}</span>
                {theme === t && <Check className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
