const BRIA_BASE_URL = "https://engine.prod.bria-api.com";
const BRIA_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "BriaSkills/1.3.0",
};

function getApiToken(): string {
  const token = process.env.BRIA_API_TOKEN;
  if (!token) throw new Error("BRIA_API_TOKEN is not set in environment variables");
  return token;
}

// ─── POLLING ─────────────────────────────────────────────────────────────────

interface BriaStatusResponse {
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  result?: { image_url?: string; urls?: string[] };
  error?: string;
}

/**
 * Poll a Bria async job until COMPLETED or FAILED.
 * Max wait: ~2 minutes (60 attempts × 2s).
 */
async function pollStatus(statusUrl: string): Promise<string> {
  const apiToken = getApiToken();

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const res = await fetch(statusUrl, {
      headers: { ...BRIA_HEADERS, api_token: apiToken },
    });

    if (!res.ok) throw new Error(`Bria poll failed: ${res.statusText}`);

    const data: BriaStatusResponse = await res.json();

    if (data.status === "COMPLETED") {
      const url = data.result?.image_url ?? data.result?.urls?.[0];
      if (!url) throw new Error("Bria returned COMPLETED but no image URL");
      return url;
    }

    if (data.status === "FAILED") {
      throw new Error(`Bria job failed: ${data.error ?? "Unknown error"}`);
    }
  }

  throw new Error("Bria job timed out after 2 minutes");
}

// ─── BACKGROUND REMOVAL ──────────────────────────────────────────────────────

interface BriaAsyncResponse {
  request_id: string;
  status_url: string;
}

/**
 * Remove background from a product image using Bria RMBG-2.0.
 * Returns a transparent PNG URL.
 */
export async function removeBackground(imageUrl: string): Promise<string> {
  const apiToken = getApiToken();

  const res = await fetch(`${BRIA_BASE_URL}/v2/image/edit/remove_background`, {
    method: "POST",
    headers: { ...BRIA_HEADERS, api_token: apiToken },
    body: JSON.stringify({ image: imageUrl }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bria removeBackground failed (${res.status}): ${err}`);
  }

  const data: BriaAsyncResponse = await res.json();
  return pollStatus(data.status_url);
}

// ─── LIFESTYLE SHOT ───────────────────────────────────────────────────────────

/**
 * Generate a lifestyle product shot by placing the product in a scene.
 * Input should be a transparent PNG (after removeBackground).
 */
export async function generateLifestyleShot(
  imageUrl: string,
  prompt: string
): Promise<string> {
  const apiToken = getApiToken();

  const res = await fetch(`${BRIA_BASE_URL}/v1/product/lifestyle_shot_by_text`, {
    method: "POST",
    headers: { ...BRIA_HEADERS, api_token: apiToken },
    body: JSON.stringify({
      image: imageUrl,
      prompt,
      num_results: 1,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bria lifestyleShot failed (${res.status}): ${err}`);
  }

  const data: BriaAsyncResponse = await res.json();
  return pollStatus(data.status_url);
}

// ─── REPLACE BACKGROUND ───────────────────────────────────────────────────────

/**
 * Replace the background of an image with an AI-generated scene.
 */
export async function replaceBackground(
  imageUrl: string,
  prompt: string
): Promise<string> {
  const apiToken = getApiToken();

  const res = await fetch(`${BRIA_BASE_URL}/v2/image/edit/replace_background`, {
    method: "POST",
    headers: { ...BRIA_HEADERS, api_token: apiToken },
    body: JSON.stringify({ image: imageUrl, prompt }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bria replaceBackground failed (${res.status}): ${err}`);
  }

  const data: BriaAsyncResponse = await res.json();
  return pollStatus(data.status_url);
}

// ─── UPSCALE ──────────────────────────────────────────────────────────────────

/**
 * Upscale an image 2x or 4x using Bria Super Resolution.
 */
export async function upscaleImage(
  imageUrl: string,
  scale: 2 | 4 = 2
): Promise<string> {
  const apiToken = getApiToken();

  const res = await fetch(`${BRIA_BASE_URL}/v2/image/edit/increase_resolution`, {
    method: "POST",
    headers: { ...BRIA_HEADERS, api_token: apiToken },
    body: JSON.stringify({ image: imageUrl, scale }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bria upscale failed (${res.status}): ${err}`);
  }

  const data: BriaAsyncResponse = await res.json();
  return pollStatus(data.status_url);
}

// ─── FULL PRODUCT PIPELINE ────────────────────────────────────────────────────

export interface ProductImagePipelineResult {
  original: string;
  noBackground: string;
  lifestyle?: string;
}

/**
 * Full product image pipeline:
 * 1. Remove background → transparent PNG
 * 2. Generate lifestyle shot (optional)
 *
 * Returns all intermediate + final URLs.
 */
export async function runProductImagePipeline(
  imageUrl: string,
  options: {
    generateLifestyle?: boolean;
    lifestylePrompt?: string;
  } = {}
): Promise<ProductImagePipelineResult> {
  const { generateLifestyle = true, lifestylePrompt } = options;

  // Step 1: Remove background
  const noBackground = await removeBackground(imageUrl);

  const result: ProductImagePipelineResult = {
    original: imageUrl,
    noBackground,
  };

  // Step 2: Lifestyle shot (optional)
  if (generateLifestyle) {
    const prompt =
      lifestylePrompt ??
      "professional product photography, modern minimalist setting, soft natural lighting, clean aesthetic";

    result.lifestyle = await generateLifestyleShot(noBackground, prompt);
  }

  return result;
}
