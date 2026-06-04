"use client";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useThemeStore } from "@/src/stores/theme-store";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const { theme } = useThemeStore();

  const themeMode = theme === "light" ? "light" : "dark";

  return (
    <div className="shadow-2xl rounded-2xl overflow-hidden">
      <Picker
        data={data}
        onEmojiSelect={(emoji: { native: string }) => onSelect(emoji.native)}
        theme={themeMode}
        previewPosition="none"
        skinTonePosition="none"
        set="native"
        onClickOutside={onClose}
        maxFrequentRows={3}
      />
    </div>
  );
}
