"use client";

import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import { getFileNameFromUrl, getFileInfo } from "./message-utils";

export function FileMessageCard({ src, isOwn }: { src: string; isOwn: boolean }) {
  const fileName = getFileNameFromUrl(src);
  const {
    ext,
    icon: Icon,
    color,
    label,
  } = useMemo(() => getFileInfo(fileName), [fileName]);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      download={fileName}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-200 max-w-[300px] sm:max-w-[340px] group ${
        isOwn
          ? "bg-primary-content/10 hover:bg-primary-content/15"
          : "bg-base-300/50 hover:bg-base-300/70"
      } ${isHovered ? "scale-[1.02]" : "scale-100"}`}
    >
      <div className="relative shrink-0">
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
            isOwn ? "bg-primary-content/15" : "bg-base-300/70"
          }`}
        >
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
        </div>
        {ext && (
          <span
            className={`absolute -top-1.5 -right-1.5 px-1 py-0.5 rounded-md text-[9px] font-bold uppercase leading-tight shadow-sm ${
              isOwn
                ? "bg-primary text-primary-content"
                : "bg-base-100 text-base-content"
            }`}
          >
            {ext}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${isOwn ? "text-primary-content/90" : "text-base-content/90"}`}
        >
          {fileName}
        </p>
        <p
          className={`text-xs mt-0.5 ${isOwn ? "text-primary-content/50" : "text-base-content/40"}`}
        >
          {label}
        </p>
      </div>

      <div
        className={`shrink-0 transition-all duration-200 ${
          isHovered ? "opacity-100 scale-110" : "opacity-40 scale-100"
        }`}
      >
        <Download
          className={`w-5 h-5 ${isOwn ? "text-primary-content/70" : "text-primary"}`}
        />
      </div>
    </a>
  );
}
