import { FileText, Film, FileArchive, FileSpreadsheet, FileType, ImageIcon, Music } from "lucide-react";
import type { PopulatedUser } from "@/src/types/entities/user";

export function getSenderName(sender: string | PopulatedUser): string {
  if (typeof sender === "string") return "Unknown";
  return sender.username;
}

export function getSenderId(sender: string | PopulatedUser): string {
  if (typeof sender === "string") return sender;
  return sender._id;
}

export function getSenderAvatar(sender: string | PopulatedUser): string | undefined {
  if (typeof sender === "string") return undefined;
  return sender.avatarUrl;
}

export function getFileNameFromUrl(url: string): string {
  try {
    const parts = url.split("/");
    const last = parts[parts.length - 1] || "file";
    return decodeURIComponent(last.split("?")[0] || last);
  } catch {
    return "file";
  }
}

export const FILE_ICONS: Record<string, { icon: typeof FileText; color: string }> = {
  pdf: { icon: FileText, color: "text-error" },
  doc: { icon: FileText, color: "text-blue-500" },
  docx: { icon: FileText, color: "text-blue-500" },
  xls: { icon: FileSpreadsheet, color: "text-emerald-500" },
  xlsx: { icon: FileSpreadsheet, color: "text-emerald-500" },
  zip: { icon: FileArchive, color: "text-amber-500" },
  rar: { icon: FileArchive, color: "text-amber-500" },
  "7z": { icon: FileArchive, color: "text-amber-500" },
  gz: { icon: FileArchive, color: "text-amber-500" },
  jpg: { icon: ImageIcon, color: "text-sky-500" },
  jpeg: { icon: ImageIcon, color: "text-sky-500" },
  png: { icon: ImageIcon, color: "text-sky-500" },
  gif: { icon: ImageIcon, color: "text-sky-500" },
  webp: { icon: ImageIcon, color: "text-sky-500" },
  svg: { icon: ImageIcon, color: "text-sky-500" },
  mp4: { icon: Film, color: "text-purple-500" },
  webm: { icon: Film, color: "text-purple-500" },
  mov: { icon: Film, color: "text-purple-500" },
  avi: { icon: Film, color: "text-purple-500" },
  mp3: { icon: Music, color: "text-violet-500" },
  wav: { icon: Music, color: "text-violet-500" },
  ogg: { icon: Music, color: "text-violet-500" },
  flac: { icon: Music, color: "text-violet-500" },
  txt: { icon: FileType, color: "text-base-content/60" },
  json: { icon: FileType, color: "text-base-content/60" },
  js: { icon: FileType, color: "text-yellow-500" },
  ts: { icon: FileType, color: "text-blue-500" },
  py: { icon: FileType, color: "text-yellow-600" },
  html: { icon: FileType, color: "text-orange-500" },
  css: { icon: FileType, color: "text-blue-400" },
};

export function getFileInfo(filename: string): {
  ext: string;
  icon: typeof FileText;
  color: string;
  label: string;
} {
  const dot = filename.lastIndexOf(".");
  const ext = dot > 0 ? filename.slice(dot + 1).toLowerCase() : "";
  const info = FILE_ICONS[ext];
  const labelMap: Record<string, string> = {
    pdf: "PDF Document",
    doc: "Word Document",
    docx: "Word Document",
    xls: "Spreadsheet",
    xlsx: "Spreadsheet",
    zip: "Archive",
    rar: "Archive",
    "7z": "Archive",
    gz: "Archive",
    jpg: "Image",
    jpeg: "Image",
    png: "Image",
    gif: "Image",
    webp: "Image",
    svg: "Image",
    mp4: "Video",
    webm: "Video",
    mov: "Video",
    avi: "Video",
    mp3: "Audio",
    wav: "Audio",
    ogg: "Audio",
    flac: "Audio",
    txt: "Text",
    json: "Data",
    js: "Script",
    ts: "Script",
    py: "Script",
    html: "Page",
    css: "Stylesheet",
  };
  if (info)
    return {
      ext,
      icon: info.icon,
      color: info.color,
      label: labelMap[ext] || `${ext.toUpperCase()} File`,
    };
  return {
    ext,
    icon: FileText,
    color: "text-primary",
    label: `${ext ? ext.toUpperCase() : ""} File`,
  };
}
