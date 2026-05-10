import { NextRequest, NextResponse } from "next/server";
import { runProductImagePipeline } from "@/lib/bria/client";
import { textToSpeechBuffer } from "@/lib/elevenlabs/client";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  productId: z.string().uuid(),
  imageUrl: z.string().url(),
  generateLifestyle: z.boolean().default(true),
  lifestylePrompt: z.string().optional(),
  generateAudio: z.boolean().default(true),
  description: z.string().optional(), // for TTS
});

/**
 * POST /api/ai/process-image
 * Full AI pipeline for a product:
 * 1. Bria AI: remove background → lifestyle shot
 * 2. ElevenLabs: generate audio description
 * 3. Upload audio to Supabase Storage
 * 4. Update product record with processed images + audio URL
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    productId,
    imageUrl,
    generateLifestyle,
    lifestylePrompt,
    generateAudio,
    description,
  } = parsed.data;

  const supabase = createAdminClient();
  const processedImages: string[] = [];
  let audioDescriptionUrl: string | null = null;

  // ── Step 1: Bria AI image pipeline ──────────────────────────────────────
  if (process.env.BRIA_API_TOKEN) {
    try {
      const pipeline = await runProductImagePipeline(imageUrl, {
        generateLifestyle,
        lifestylePrompt,
      });

      processedImages.push(pipeline.noBackground);
      if (pipeline.lifestyle) processedImages.push(pipeline.lifestyle);
    } catch (err) {
      console.error("Bria pipeline error:", err instanceof Error ? err.message : err);
      // Non-fatal — continue without processed images
    }
  } else {
    console.warn("BRIA_API_TOKEN not set — skipping image processing");
  }

  // ── Step 2: ElevenLabs TTS audio description ─────────────────────────────
  if (generateAudio && description && process.env.ELEVENLABS_API_KEY) {
    try {
      const audioBuffer = await textToSpeechBuffer(description);

      // Upload to Supabase Storage
      const audioPath = `audio/${productId}.mp3`;
      const { error: uploadError } = await supabase.storage
        .from("product-audio")
        .upload(audioPath, audioBuffer, {
          contentType: "audio/mpeg",
          upsert: true,
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("product-audio")
          .getPublicUrl(audioPath);
        audioDescriptionUrl = urlData.publicUrl;
      } else {
        console.error("Audio upload error:", uploadError.message);
      }
    } catch (err) {
      console.error("TTS error:", err instanceof Error ? err.message : err);
      // Non-fatal — continue without audio
    }
  }

  // ── Step 3: Update product record ────────────────────────────────────────
  const updateData: Record<string, unknown> = {
    is_active: true,
  };

  if (processedImages.length > 0) {
    updateData.processed_images = processedImages;
  }

  if (audioDescriptionUrl) {
    updateData.audio_description_url = audioDescriptionUrl;
  }

  const { error: updateError } = await supabase
    .from("products")
    .update(updateData as any)
    .eq("id", productId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    processedImages,
    audioDescriptionUrl,
  });
}
