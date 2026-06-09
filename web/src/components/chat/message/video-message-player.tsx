"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Film, Play, Pause, Maximize2 } from "lucide-react";

export function VideoMessagePlayer({ src, isOwn }: { src: string; isOwn: boolean }) {
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
