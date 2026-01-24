/**
 * Background removal helper using remove.bg API
 * 
 * API Documentation: https://www.remove.bg/api
 * Pricing: First 50 API calls per month are free
 * Rate limit: 500 images per minute
 * 
 * Example usage:
 *   const { url } = await removeBackground({
 *     imageUrl: "https://example.com/image.jpg"
 *   });
 */

import { storagePut } from "../storage";

export type RemoveBackgroundOptions = {
  imageUrl?: string;
  imageBuffer?: Buffer;
  size?: "auto" | "preview" | "full" | "medium" | "hd" | "4k";
  type?: "auto" | "person" | "product" | "car";
  format?: "auto" | "png" | "jpg" | "zip";
};

export type RemoveBackgroundResponse = {
  url: string;
  fileKey: string;
};

/**
 * Remove background from an image using remove.bg API
 */
export async function removeBackground(
  options: RemoveBackgroundOptions
): Promise<RemoveBackgroundResponse> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  
  if (!apiKey) {
    throw new Error("REMOVE_BG_API_KEY is not configured. Please add it to your environment variables.");
  }

  const formData = new FormData();
  
  // Add image source
  if (options.imageUrl) {
    formData.append("image_url", options.imageUrl);
  } else if (options.imageBuffer) {
    const blob = new Blob([new Uint8Array(options.imageBuffer)], { type: "image/png" });
    formData.append("image_file", blob, "image.png");
  } else {
    throw new Error("Either imageUrl or imageBuffer must be provided");
  }

  // Add optional parameters
  formData.append("size", options.size || "auto");
  if (options.type) {
    formData.append("type", options.type);
  }
  formData.append("format", options.format || "png");

  // Call remove.bg API
  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Background removal failed (${response.status} ${response.statusText})${errorText ? `: ${errorText}` : ""}`
    );
  }

  // Get the processed image as buffer
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to S3
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(7);
  const fileKey = `no-bg/${timestamp}-${randomSuffix}.png`;
  
  const { url } = await storagePut(fileKey, buffer, "image/png");

  return {
    url,
    fileKey,
  };
}

/**
 * Check if background removal is needed for a specific asset type
 */
export function shouldRemoveBackground(assetType: string): boolean {
  // Logo, PFP, and certain website elements benefit from transparent backgrounds
  const needsTransparency = ["logo", "pfp", "icon", "avatar"];
  return needsTransparency.includes(assetType.toLowerCase());
}
