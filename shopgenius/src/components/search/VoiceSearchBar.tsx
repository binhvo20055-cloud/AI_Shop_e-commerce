"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Search, Loader2, Waves } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type RecordingState = "idle" | "recording" | "processing";

interface VoiceSearchBarProps {
  initialQuery?: string;
}

export function VoiceSearchBar({ initialQuery = "" }: VoiceSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scribeRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scribeRef.current) {
        try { scribeRef.current.disconnect(); } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startRealtimeRecording = useCallback(async () => {
    try {
      // Mint a single-use Scribe token from backend (never expose API key to browser)
      const tokenRes = await fetch("/api/ai/scribe-token");

      if (!tokenRes.ok) {
        // Fallback to file-based STT if token endpoint fails (e.g. not logged in)
        await startFileRecording();
        return;
      }

      const { token } = await tokenRes.json();

      // Dynamically import browser SDK to avoid SSR issues
      const { Scribe, RealtimeEvents } = await import("@elevenlabs/client");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const connection = Scribe.connect({
        token,
        modelId: "scribe_v2_realtime",
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      scribeRef.current = connection;

      connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (data: { text: string }) => {
        setLiveTranscript(data.text);
      });

      connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (data: { text: string }) => {
        setQuery((prev) => (prev ? `${prev} ${data.text}` : data.text).trim());
        setLiveTranscript("");
      });

      setRecordingState("recording");

      // Auto-stop after 15 seconds
      setTimeout(() => {
        if (recordingState === "recording") stopRealtimeRecording();
      }, 15000);
    } catch (err) {
      console.error("Realtime STT error:", err);
      // Fallback to file-based STT
      await startFileRecording();
    }
  }, [recordingState]);

  const stopRealtimeRecording = useCallback(() => {
    if (scribeRef.current) {
      try { scribeRef.current.disconnect(); } catch {}
      scribeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setRecordingState("idle");
    setLiveTranscript("");
  }, []);

  // Fallback: file-based STT (for unauthenticated users)
  const startFileRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecordingState("processing");

        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        try {
          const res = await fetch("/api/ai/speech-to-text", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.text) {
            setQuery(data.text);
            router.push(`/search?q=${encodeURIComponent(data.text)}`);
          } else {
            toast.error("Could not understand audio. Please try again.");
          }
        } catch {
          toast.error("Voice recognition failed. Please try again.");
        } finally {
          setRecordingState("idle");
        }
      };

      mediaRecorder.start();
      setRecordingState("recording");

      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 10000);
    } catch {
      toast.error("Microphone access denied. Please allow microphone access.");
      setRecordingState("idle");
    }
  }, [router]);

  const handleMicClick = useCallback(() => {
    if (recordingState === "recording") {
      if (scribeRef.current) {
        stopRealtimeRecording();
        // Search with what we have
        const finalQuery = query.trim();
        if (finalQuery) router.push(`/search?q=${encodeURIComponent(finalQuery)}`);
      } else if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    } else if (recordingState === "idle") {
      startRealtimeRecording();
    }
  }, [recordingState, query, router, startRealtimeRecording, stopRealtimeRecording]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const displayQuery = recordingState === "recording" && liveTranscript
    ? liveTranscript
    : query;

  return (
    <form
      onSubmit={handleSearch}
      className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-border p-2 max-w-2xl mx-auto"
      role="search"
    >
      <Search className="ml-2 h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />

      <input
        type="text"
        value={displayQuery}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={
          recordingState === "recording"
            ? "Listening..."
            : "Search products or use voice..."
        }
        className={cn(
          "flex-1 bg-transparent outline-none text-sm px-2 py-1 transition-colors",
          recordingState === "recording" && "text-brand-600 dark:text-brand-400"
        )}
        aria-label="Search products"
        readOnly={recordingState === "recording"}
      />

      {/* Voice button */}
      <button
        type="button"
        onClick={handleMicClick}
        disabled={recordingState === "processing"}
        aria-label={
          recordingState === "recording"
            ? "Stop voice search"
            : "Start voice search"
        }
        aria-pressed={recordingState === "recording"}
        className={cn(
          "p-2 rounded-xl transition-all shrink-0",
          recordingState === "recording"
            ? "bg-red-500 text-white"
            : recordingState === "processing"
            ? "bg-muted text-muted-foreground"
            : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
        )}
      >
        {recordingState === "processing" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : recordingState === "recording" ? (
          <Waves className="h-5 w-5 animate-pulse" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </button>

      {/* Search button */}
      <button
        type="submit"
        disabled={!query.trim() && recordingState !== "recording"}
        className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors shrink-0"
      >
        Search
      </button>
    </form>
  );
}
