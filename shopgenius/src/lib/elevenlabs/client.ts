const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

/**
 * Convert text to speech using ElevenLabs
 * Returns an audio blob URL
 */
export async function textToSpeech(
  text: string,
  voiceId?: string
): Promise<string> {
  const targetVoiceId =
    voiceId ?? process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";

  const response = await fetch(
    `${ELEVENLABS_BASE_URL}/text-to-speech/${targetVoiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs TTS failed: ${response.statusText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
  return URL.createObjectURL(blob);
}

/**
 * Speech to text transcription using ElevenLabs
 */
export async function speechToText(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("model_id", "scribe_v1");

  const response = await fetch(`${ELEVENLABS_BASE_URL}/speech-to-text`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs STT failed: ${response.statusText}`);
  }

  const data: { text: string } = await response.json();
  return data.text;
}

/**
 * List available voices
 */
export async function getVoices() {
  const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs getVoices failed: ${response.statusText}`);
  }

  return response.json();
}
