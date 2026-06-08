"use client";

import { motion } from "framer-motion";
import type { Message } from "@/src/types/entities/message";
import type { PopulatedUser } from "@/src/types/entities/user";
import { useCurrentUser } from "@/src/hooks/use-auth";
import { UserAvatar } from "@/src/components/common/user-avatar";
import { format } from "date-fns";
import {
  FileText,
  Reply,
  Edit3,
  Trash2,
  Download,
  Film,
  Play,
  Pause,
  Maximize2,
  FileArchive,
  FileSpreadsheet,
  FileType,
  ImageIcon,
  Music,
  Copy,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  isGrouped?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  conversationType?: "private" | "group";
  conversationAdmins?: string[];
  conversationOwner?: string;
  searchQuery?: string;
}

function getSenderName(sender: string | PopulatedUser): string {
  if (typeof sender === "string") return "Unknown";
  return sender.username;
}

function getSenderId(sender: string | PopulatedUser): string {
  if (typeof sender === "string") return sender;
  return sender._id;
}

function getSenderAvatar(sender: string | PopulatedUser): string | undefined {
  if (typeof sender === "string") return undefined;
  return sender.avatarUrl;
}

function HighlightedText({ text, query }: { text: string; query?: string }) {
  if (!query || !query.trim()) {
    return <span className="text-sm">{text}</span>;
  }

  const parts = text.split(
    new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
  );
  return (
    <span className="text-sm">
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-warning/30 text-inherit rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  );
}

function getFileNameFromUrl(url: string): string {
  try {
    const parts = url.split("/");
    const last = parts[parts.length - 1] || "file";
    return decodeURIComponent(last.split("?")[0] || last);
  } catch {
    return "file";
  }
}

const FILE_ICONS: Record<string, { icon: typeof FileText; color: string }> = {
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

function getFileInfo(filename: string): {
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

function FileMessageCard({ src, isOwn }: { src: string; isOwn: boolean }) {
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

function VideoMessagePlayer({ src, isOwn }: { src: string; isOwn: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(1);
  const PLAYBACK_SPEEDS = useMemo(() => [0.5, 1, 1.5, 2], []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onDur = () => {
      if (v.duration && isFinite(v.duration)) setDuration(v.duration);
    };
    const onEnd = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("durationchange", onDur);
    v.addEventListener("ended", onEnd);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    if (v.readyState >= 1 && v.duration) onDur();
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("durationchange", onDur);
      v.removeEventListener("ended", onEnd);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const cycleSpeed = useCallback(() => {
    const next = (speedIdx + 1) % PLAYBACK_SPEEDS.length;
    setSpeedIdx(next);
    if (videoRef.current) videoRef.current.playbackRate = PLAYBACK_SPEEDS[next];
  }, [speedIdx, PLAYBACK_SPEEDS]);

  const seek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const v = videoRef.current;
      const bar = progressRef.current;
      if (!v || !bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      v.currentTime = ratio * duration;
      setCurrentTime(v.currentTime);
    },
    [duration],
  );

  const toggleFullscreen = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    } else {
      await v.requestFullscreen().catch(() => {});
    }
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`max-w-[300px] sm:max-w-[340px] rounded-xl overflow-hidden ${
        isOwn ? "bg-primary/10" : "bg-base-300/40"
      }`}
    >
      <div className="relative group cursor-pointer" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={src}
          className="w-full aspect-video object-cover bg-black"
          preload="metadata"
          playsInline
        />

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity group-hover:bg-black/30">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl transition-transform group-hover:scale-105">
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current text-gray-900 ml-1" />
            </div>
          </div>
        )}

        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        {duration > 0 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[11px] font-medium tabular-nums">
            {fmt(duration)}
          </div>
        )}

        <div
          className={`absolute bottom-1.5 inset-x-2 h-0.5 rounded-full overflow-hidden ${
            isPlaying ? "opacity-100" : "opacity-0"
          } transition-opacity duration-300`}
        >
          <div
            className="h-full rounded-full bg-white/80 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div
        className={`flex items-center gap-2 px-3 py-2 ${
          isOwn ? "text-primary-content" : "text-base-content"
        }`}
      >
        <Film className="w-4 h-4 shrink-0 opacity-50" />
        <span className="text-xs font-medium opacity-60">
          {fmt(isPlaying || currentTime > 0 ? currentTime : duration)}
        </span>
        <div className="flex-1" />

        <button
          onClick={toggleFullscreen}
          className="p-1 rounded opacity-40 hover:opacity-80 transition-opacity"
          title="Fullscreen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={cycleSpeed}
          className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded transition-opacity hover:opacity-100 ${
            speedIdx !== 1 ? "opacity-100 font-extrabold" : "opacity-50"
          }`}
        >
          {PLAYBACK_SPEEDS[speedIdx]}x
        </button>
      </div>

      <div
        ref={progressRef}
        onClick={seek}
        className={`relative h-1 cursor-pointer overflow-hidden ${
          isOwn ? "bg-primary-content/10" : "bg-base-content/10"
        }`}
      >
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-100 ${
            isOwn ? "bg-primary-content/60" : "bg-primary/50"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function VoiceMessagePlayer({ src, isOwn }: { src: string; isOwn: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(1);
  const PLAYBACK_SPEEDS = useMemo(() => [0.5, 1, 1.5, 2], []);

  const barHeights = useMemo(
    () => [
      15, 22, 30, 40, 52, 62, 70, 65, 55, 42, 30, 20, 15, 22, 35, 48, 60, 72,
      78, 68, 55, 38, 25, 16, 20, 35, 50, 62, 52, 28,
    ],
    [],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDur = () => {
      if (audio.duration && isFinite(audio.duration))
        setDuration(audio.duration);
    };
    const onEnd = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("durationchange", onDur);
    audio.addEventListener("ended", onEnd);
    if (audio.readyState >= 1 && audio.duration) onDur();
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("durationchange", onDur);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      a.play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  }, [isPlaying]);

  const cycleSpeed = useCallback(() => {
    const next = (speedIdx + 1) % PLAYBACK_SPEEDS.length;
    setSpeedIdx(next);
    if (audioRef.current) audioRef.current.playbackRate = PLAYBACK_SPEEDS[next];
  }, [speedIdx, PLAYBACK_SPEEDS]);

  const seek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const a = audioRef.current;
      const bar = progressRef.current;
      if (!a || !bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      a.currentTime = ratio * duration;
      setCurrentTime(a.currentTime);
    },
    [duration],
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`flex items-center gap-2 min-w-[220px] sm:min-w-[280px] ${isOwn ? "text-primary-content" : "text-base-content"}`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={togglePlay}
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 ${
          isOwn
            ? "bg-primary-content/15 hover:bg-primary-content/25 text-primary-content"
            : "bg-primary/10 hover:bg-primary/20 text-primary"
        }`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
        ) : (
          <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-end gap-[2px] h-8 sm:h-10 overflow-hidden">
          {barHeights.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-full transition-all duration-150 ease-linear"
              style={{
                height: `${h}%`,
                backgroundColor: isOwn
                  ? isPlaying
                    ? `rgba(255,255,255,${0.2 + Math.abs(Math.sin(Date.now() * 0.003 + i * 0.4)) * 0.5})`
                    : "rgba(255,255,255,0.25)"
                  : isPlaying
                    ? `rgba(0,0,0,${0.15 + Math.abs(Math.sin(Date.now() * 0.003 + i * 0.4)) * 0.4})`
                    : "rgba(0,0,0,0.15)",
                transformOrigin: "bottom",
              }}
            />
          ))}
        </div>

        <div
          ref={progressRef}
          onClick={seek}
          className={`relative h-1 rounded-full cursor-pointer overflow-hidden ${
            isOwn ? "bg-primary-content/20" : "bg-base-content/15"
          }`}
        >
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-100 ${
              isOwn ? "bg-primary-content/70" : "bg-primary/60"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-medium tabular-nums opacity-60">
            {fmt(isPlaying || currentTime > 0 ? currentTime : duration)}
          </span>
          <button
            onClick={cycleSpeed}
            className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded transition-opacity hover:opacity-100 ${
              speedIdx !== 1 ? "opacity-100 font-extrabold" : "opacity-50"
            } ${isOwn ? "text-primary-content/80" : "text-base-content/60"}`}
          >
            {PLAYBACK_SPEEDS[speedIdx]}x
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageContent({
  message,
  searchQuery,
  isOwn,
}: {
  message: Message;
  searchQuery?: string;
  isOwn: boolean;
}) {
  if (message.deleted) {
    return (
      <span className="italic text-primary-content text-xs">
        [Message deleted]
      </span>
    );
  }

  switch (message.type) {
    case "image":
      return (
        <div className="space-y-1">
          <img
            src={message.content}
            alt="Shared image"
            className="max-w-[280px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
          />
        </div>
      );
    case "video":
      return <VideoMessagePlayer src={message.content} isOwn={isOwn} />;
    case "voice":
      return (
        <div className="max-w-[300px] sm:max-w-[340px] -mx-1.5">
          <VoiceMessagePlayer src={message.content} isOwn={isOwn} />
        </div>
      );
    case "file":
      return <FileMessageCard src={message.content} isOwn={isOwn} />;
    default:
      return <HighlightedText text={message.content} query={searchQuery} />;
  }
}

export function MessageBubble({
  message,
  showAvatar = true,
  isGrouped = false,
  onReply,
  onEdit,
  onDelete,
  conversationType,
  conversationAdmins,
  conversationOwner,
  searchQuery,
}: MessageBubbleProps) {
  const { user } = useCurrentUser();
  const isOwn = getSenderId(message.senderId) === user?._id;
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [contextMenu]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
  }, []);

  const handleOpenMenu = (
    e: React.MouseEvent | React.TouchEvent,
    clientX: number,
    clientY: number,
  ) => {
    e.preventDefault();
    setContextMenu({ x: clientX, y: clientY });
    setTimeout(() => {
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let adjustedX = e.clientX;
        let adjustedY = e.clientY;

        // Horizontal adjustment
        if (adjustedX + rect.width > viewportWidth) {
          adjustedX = viewportWidth - rect.width - 10;
        }
        if (adjustedX < 0) {
          adjustedX = 10;
        }

        // Vertical adjustment
        if (adjustedY + rect.height > viewportHeight) {
          adjustedY = viewportHeight - rect.height - 10;
        }
        if (adjustedY < 0) {
          adjustedY = 10;
        }

        // If menu would overlap cursor, shift it slightly
        const cursorRect = { x: e.clientX, y: e.clientY, width: 5, height: 20 };
        if (Math.abs(adjustedX - cursorRect.x) < 20) {
          adjustedX = isOwn ? adjustedX - rect.width - 10 : adjustedX + 20;
        }

        setContextMenu({ x: adjustedX, y: adjustedY });
      }
    }, 0);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Message copied");
    } catch {
      toast.error("Failed to copy message");
    }
    setContextMenu(null);
  };

  const canDelete =
    isOwn ||
    (conversationType === "group" &&
      (conversationOwner === user?._id ||
        conversationAdmins?.includes(user?._id || "")));

  const canEdit = isOwn && message.type === "text";

  const replyToData = message.replyTo as {
    _id: string;
    content: string;
    type: string;
    senderId: string | { _id: string; username: string };
  } | null;

  const getReplySenderName = () => {
    if (!replyToData) return "";
    if (typeof replyToData.senderId === "string") return "Unknown";
    return replyToData.senderId.username;
  };

  const getReplyContent = () => {
    if (!replyToData) return "";
    const content = replyToData.content;
    return content.length > 60 ? content.substring(0, 60) + "..." : content;
  };

  return (
    <motion.div
      id={`msg-${message._id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""} ${
        isGrouped ? "mt-0.5" : "mt-3"
      } group`}
    >
      {showAvatar ? (
        <UserAvatar
          src={getSenderAvatar(message.senderId)}
          alt={getSenderName(message.senderId)}
          size="sm"
          className="mt-1"
        />
      ) : (
        <div className="w-7 shrink-0" />
      )}

      <div
        ref={bubbleRef}
        className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}
      >
        {!isGrouped && !isOwn && (
          <span className="text-xs text-base-content/40 mb-0.5 ml-1">
            {getSenderName(message.senderId)}
          </span>
        )}

        {/* Reply Message Box (Telegram Style) */}
        {replyToData && !message.deleted ? (
          <div
            className={`relative ${isOwn ? "items-end" : "items-start"} flex flex-col`}
          >
            <div
              className={`text-xs p-2 rounded-t-lg ${
                isOwn
                  ? "bg-primary rounded-br-none text-primary-content"
                  : "bg-base-200 rounded-bl-none text-base-content"
              }`}
              onContextMenu={(e)=>handleOpenMenu(e , e.clientX , e.clientY)}
              onClick={(e) =>
                isMobile && handleOpenMenu(e, e.clientX, e.clientY)
              }
            >
              <div
                className={`p-1.5 rounded mb-1.5 ${
                  isOwn ? "bg-primary-content/20" : "bg-base-300/50"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-0.5 h-3 rounded-full bg-primary/60" />
                  <span className="text-[11px] text-primary font-medium opacity-80">
                    {getReplySenderName()}
                  </span>
                </div>
                <p className="text-[11px] opacity-70 line-clamp-2 pl-2">
                  {getReplyContent()}
                </p>
              </div>

              <div>
                <MessageContent
                  message={message}
                  searchQuery={searchQuery}
                  isOwn={isOwn}
                />
              </div>
            </div>

            <div
              className={`flex items-center gap-1 mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <span
                className={`text-[10px] ${isOwn ? "text-primary-content/40" : "text-base-content/40"}`}
              >
                {format(new Date(message.createdAt), "HH:mm")}
              </span>
              {message.edited && (
                <span
                  className={`text-[10px] ${isOwn ? "text-primary-content/30" : "text-base-content/30"}`}
                >
                  edited
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Normal Message Box */
          <>
            <div
              className={`relative px-3 py-2 ${
                isOwn
                  ? "bg-primary text-primary-content rounded-2xl rounded-tr-md"
                  : "bg-base-200 rounded-2xl rounded-tl-md"
              }`}
              onContextMenu={(e)=>handleOpenMenu(e , e.clientX , e.clientY)}
              onClick={(e) =>
                isMobile && handleOpenMenu(e, e.clientX, e.clientY)
              }
            >
              <MessageContent
                message={message}
                searchQuery={searchQuery}
                isOwn={isOwn}
              />
              <div
                className={`flex items-center gap-1 mt-0.5 ${
                  isOwn ? "justify-end" : "justify-start"
                }`}
              >
                <span
                  className={`text-[10px] ${isOwn ? "text-primary-content/60" : "text-base-content/40"}`}
                >
                  {format(new Date(message.createdAt), "HH:mm")}
                </span>
                {isOwn && !message.deleted && (
                  <span className="inline-flex items-center text-[10px]">
                    {message.readBy && message.readBy.length > 0 ? (
                      <span className="relative w-4 h-3.5 text-info">
                        <svg
                          className="absolute left-0 top-0 w-3 h-3"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                        <svg
                          className="absolute left-[5px] top-0 w-3 h-3"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      </span>
                    ) : message.deliveredTo && message.deliveredTo.length > 1 ? (
                      <span className="relative w-4 h-3.5 text-primary-content/70">
                        <svg
                          className="absolute left-0 top-0 w-3 h-3"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                        <svg
                          className="absolute left-[5px] top-0 w-3 h-3"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      </span>
                    ) : (
                      <svg className="w-3 h-3 text-primary-content/40" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    )}
                  </span>
                )}
                {message.edited && !message.deleted && (
                  <span
                    className={`text-[10px] ${isOwn ? "text-primary-content/50" : "text-base-content/30"}`}
                  >
                    edited
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {/* Context Menu */}
        {contextMenu && !message.deleted && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setContextMenu(null)}
            />
            <div
              ref={menuRef}
              className="fixed z-50 bg-base-100 rounded-xl border border-base-300 shadow-2xl py-1 min-w-[160px]"
              style={{
                top: contextMenu.y,
                left: contextMenu.x,
                maxWidth: "calc(100vw - 20px)",
              }}
            >
              {onReply && (
                <button
                  onClick={() => {
                    onReply(message);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-200 transition-colors text-left"
                >
                  <Reply className="w-4 h-4 text-base-content/60" />
                  Reply
                </button>
              )}
              {canEdit && onEdit && (
                <button
                  onClick={() => {
                    onEdit(message);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-200 transition-colors text-left"
                >
                  <Edit3 className="w-4 h-4 text-base-content/60" />
                  Edit
                </button>
              )}
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-200 transition-colors text-left"
              >
                <Copy className="w-4 h-4 text-base-content/60" />
                Copy
              </button>
              {canDelete && onDelete && (
                <>
                  <div className="h-px bg-base-300 my-1" />
                  <button
                    onClick={() => {
                      onDelete(message._id);
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-200 transition-colors text-left text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
