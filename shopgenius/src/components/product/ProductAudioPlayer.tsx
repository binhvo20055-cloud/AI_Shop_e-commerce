"use client";

import { useState, useRef, useCallback } from "react";
import { Play, Pause, Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductAudioPlayerProps {
  /** Pre-generated audio URL from Supabase Storage */
  audioUrl?: string;
  /** Product description — used to generate TTS on-demand if no audioUrl */
  description?: string;
  productName: string;
}

export function ProductAudioPlayer({
  audioUrl,
  description,
  productName,
}: ProductAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(audioUrl ?? null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const loadAndPlay = useCallback(async () => {
    if (resolvedUrl) {
      // Already have URL — just play
      audioRef.current?.play();
      setIsPlaying(true);
      return;
    }

    if (!description) return;

    // Generate TTS on-demand via streaming API
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: description }),
      });

      if (!res.ok) throw new Error("TTS generation failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResolvedUrl(url);

      // Play after setting URL
      setTimeout(() => {
        audioRef.current?.play();
        setIsPlaying(true);
      }, 50);
    } catch (err) {
      console.error("Audio load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [resolvedUrl, description]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      loadAndPlay();
    }
  }, [isPlaying, loadAndPlay]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setProgress(isNaN(pct) ? 0 : pct);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * audioRef.current.duration;
  };

  const canPlay = !!audioUrl || !!description;
  if (!canPlay) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
      <Volume2 className="h-4 w-4 text-brand-500 shrink-0" aria-hidden="true" />

      <span className="text-sm text-muted-foreground flex-1 truncate">
        Listen to description
      </span>

      {/* Progress bar */}
      <div
        className="flex-1 h-1.5 bg-border rounded-full overflow-hidden cursor-pointer"
        onClick={handleProgressClick}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Audio progress"
      >
        <div
          className="h-full bg-brand-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        disabled={isLoading}
        aria-label={isPlaying ? `Pause audio description for ${productName}` : `Play audio description for ${productName}`}
        className={cn(
          "p-2 rounded-lg transition-colors shrink-0",
          isLoading
            ? "bg-muted text-muted-foreground"
            : "bg-brand-500 hover:bg-brand-600 text-white"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>

      {resolvedUrl && (
        <audio
          ref={audioRef}
          src={resolvedUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPause={() => setIsPlaying(false)}
          aria-label={`Audio description for ${productName}`}
          preload="none"
        />
      )}
    </div>
  );
}
