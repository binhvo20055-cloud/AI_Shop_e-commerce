import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/ai/scribe-token
 * Mints a single-use ElevenLabs Scribe token for browser-side realtime STT.
 * Requires authentication — never expose the API key to the browser.
 *
 * Single-use tokens expire quickly, so mint them just before the session starts.
 */
export async function GET(request: NextRequest) {
  // Require auth — don't expose token to unauthenticated users
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json(
      { error: "ElevenLabs API key not configured" },
      { status: 503 }
    );
  }

  try {
    const client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });

    const token = await client.tokens.singleUse.create("realtime_scribe");

    return NextResponse.json(token, {
      headers: {
        // Don't cache — tokens are single-use
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token creation failed";
    console.error("Scribe token error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
