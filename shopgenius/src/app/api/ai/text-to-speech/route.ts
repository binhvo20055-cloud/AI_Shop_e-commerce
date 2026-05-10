import { NextRequest, NextResponse } from "next/server";
import { textToSpeechStream } from "@/lib/elevenlabs/client";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().optional(),
});

/**
 * POST /api/ai/text-to-speech
 * Streams MP3 audio from ElevenLabs TTS.
 * Uses eleven_flash_v2_5 for low-latency multilingual output.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: "ElevenLabs API key not configured" },
      { status: 503 }
    );
  }

  try {
    const audioStream = await textToSpeechStream(parsed.data.text, parsed.data.voiceId);

    return new NextResponse(audioStream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, immutable",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TTS generation failed";
    console.error("TTS error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
