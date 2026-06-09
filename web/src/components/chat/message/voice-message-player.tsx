"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Play, Pause } from "lucide-react";

export function VoiceMessagePlayer({ src, isOwn }: { src: string; isOwn: boolean }) {
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
