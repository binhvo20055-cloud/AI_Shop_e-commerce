const BRIA_BASE_URL = "https://engine.prod.bria-api.com/v1";

interface BriaRemoveBgResponse {
  result_url: string;
}

interface BriaLifeshotResponse {
  result_url: string;
}

/**
 * Remove background from a product image using Bria AI
 */
export async function removeBackground(imageUrl: string): Promise<string> {
  const response = await fetch(`${BRIA_BASE_URL}/background/remove`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      api_token: process.env.BRIA_API_TOKEN!,
    },
    body: JSON.stringify({ image_url: imageUrl }),
  });

  if (!response.ok) {
    throw new Error(`Bria removeBackground failed: ${response.statusText}`);
  }

  const data: BriaRemoveBgResponse = await response.json();
  return data.result_url;
}

/**
 * Generate a lifestyle product shot using Bria AI
 */
export async function generateLifestyleShot(
  imageUrl: string,
  prompt: string
): Promise<string> {
  const response = await fetch(`${BRIA_BASE_URL}/product_shot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      api_token: process.env.BRIA_API_TOKEN!,
    },
    body: JSON.stringify({
      image_url: imageUrl,
      prompt,
      num_results: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Bria generateLifestyleShot failed: ${response.statusText}`);
  }

  const data: BriaLifeshotResponse = await response.json();
  return data.result_url;
}

/**
 * Upscale a product image using Bria AI
 */
export async function upscaleImage(imageUrl: string): Promise<string> {
  const response = await fetch(`${BRIA_BASE_URL}/image/upscale`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      api_token: process.env.BRIA_API_TOKEN!,
    },
    body: JSON.stringify({ image_url: imageUrl }),
  });

  if (!response.ok) {
    throw new Error(`Bria upscaleImage failed: ${response.statusText}`);
  }

  const data: { result_url: string } = await response.json();
  return data.result_url;
}
