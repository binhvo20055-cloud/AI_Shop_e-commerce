import { NextRequest, NextResponse } from "next/server";
import { getElevenLabsClient } from "@/lib/elevenlabs/client";

/**
 * POST /api/ai/speech-to-text
 * Transcribes an audio file using ElevenLabs Scribe v1.
 * For non-realtime (file upload) transcription.
 * Accepts multipart/form-data with an "audio" field.
 */
export async function POST(request: NextRequest) {
  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: "ElevenLabs API key not configured" },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const audio = formData.get("audio") as Blob | null;

  if (!audio) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  if (audio.size > 25 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Audio file too large (max 25MB)" },
      { status: 413 }
    );
  }

  try {
    const client = getElevenLabsClient();

    const transcription = await client.speechToText.convert({
      file: audio as File,
      modelId: "scribe_v1",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcription failed";
    console.error("STT error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
