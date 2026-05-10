import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Server-side singleton
let _client: ElevenLabsClient | null = null;

export function getElevenLabsClient(): ElevenLabsClient {
  if (!_client) {
    _client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }
  return _client;
}

/**
 * Convert text to speech — returns a Node.js ReadableStream of MP3 audio.
 * Uses eleven_flash_v2_5 for low-latency multilingual output.
 */
export async function textToSpeechStream(
  text: string,
  voiceId?: string
): Promise<ReadableStream<Uint8Array>> {
  const client = getElevenLabsClient();
  const targetVoiceId = voiceId ?? process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";

  const audioStream = await client.textToSpeech.convert(targetVoiceId, {
    text,
    modelId: "eleven_flash_v2_5", // lowest-latency multilingual
    outputFormat: "mp3_44100_128",
    voiceSettings: {
      stability: 0.5,
      similarityBoost: 0.75,
      useSpeakerBoost: false,
    },
  });

  // Convert Node.js Readable to Web ReadableStream
  const { Readable } = await import("stream");
  const nodeStream = audioStream as unknown as NodeJS.ReadableStream;

  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      if ("destroy" in nodeStream) (nodeStream as any).destroy();
    },
  });
}

/**
 * Convert text to speech — returns a Buffer (for saving to storage).
 */
export async function textToSpeechBuffer(
  text: string,
  voiceId?: string
): Promise<Buffer> {
  const client = getElevenLabsClient();
  const targetVoiceId = voiceId ?? process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID ?? "JBFqnCBsd6RMkjVDRZzb";

  const audioStream = await client.textToSpeech.convert(targetVoiceId, {
    text,
    modelId: "eleven_flash_v2_5",
    outputFormat: "mp3_44100_128",
    voiceSettings: {
      stability: 0.5,
      similarityBoost: 0.75,
      useSpeakerBoost: false,
    },
  });

  const chunks: Uint8Array[] = [];
  // audioStream is a Node.js Readable — iterate it
  for await (const chunk of audioStream as unknown as AsyncIterable<Uint8Array>) {
    chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Transcribe audio file using ElevenLabs Scribe.
 * For server-side file transcription (not realtime).
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const client = getElevenLabsClient();

  const transcription = await client.speechToText.convert({
    file: audioBlob as File,
    modelId: "scribe_v1",
  });

  return transcription.text;
}

/**
 * List available voices.
 */
export async function listVoices() {
  const client = getElevenLabsClient();
  const response = await client.voices.getAll();
  return response.voices;
}
