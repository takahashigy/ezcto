/**
 * Image generation helper using Nanobanana API
 *
 * Example usage:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "A serene landscape with mountains"
 *   });
 *
 * For editing:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "Add a rainbow to this landscape",
 *     originalImages: [{
 *       url: "https://example.com/original.jpg",
 *       mimeType: "image/jpeg"
 *     }]
 *   });
 */
import { storagePut } from "server/storage";

export type ImageSize = 
  | "512x512"      // Logo
  | "1024x1024"    // Default square
  | "1500x500"     // PayDex Banner
  | "1200x480"     // X/Twitter Banner
  | "1920x1080"    // Hero Background
  | "256x256"      // Feature Icons
  | "800x600";     // Community Scene

export type GenerateImageOptions = {
  prompt: string;
  size?: ImageSize;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const nanobananaApiKey = process.env.NANOBANANA_API_KEY;
  
  if (!nanobananaApiKey) {
    throw new Error("NANOBANANA_API_KEY is not configured");
  }

  // Nanobanana API endpoint
  const apiUrl = "https://api.google-banana.com/v1/images/generations";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${nanobananaApiKey}`,
    },
    body: JSON.stringify({
      model: "gemini-3-pro-image-preview-2k",
      prompt: options.prompt,
      n: 1,
      size: options.size || "1024x1024",
      response_format: "url", // Changed from b64_json to url
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Nanobanana image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    data: Array<{
      url: string;
    }>;
  };

  if (!result.data || result.data.length === 0) {
    throw new Error("No image data returned from Nanobanana API");
  }

  // Nanobanana returns the image URL directly
  const imageUrl = result.data[0].url;

  // Download the image and upload to our S3
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download generated image from ${imageUrl}`);
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

  // Save to S3
  const { url } = await storagePut(
    `generated/${Date.now()}.png`,
    imageBuffer,
    "image/png"
  );

  return {
    url,
  };
}
