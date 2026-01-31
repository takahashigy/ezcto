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

  // Nanobanana API endpoint (using chat/completions)
  const apiUrl = "https://api.google-banana.com/v1/chat/completions";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${nanobananaApiKey}`,
    },
    body: JSON.stringify({
      model: "gemini-3-pro-image-preview-2K",
      messages: [
        {
          role: "user",
          content: options.prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Nanobanana image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
  };

  if (!result.choices || result.choices.length === 0) {
    throw new Error("No image data returned from Nanobanana API");
  }

  // Nanobanana returns the image URL in Markdown format: ![image](url)
  const content = result.choices[0].message.content;
  const urlMatch = content.match(/!\[image\]\((.+?)\)/);
  
  if (!urlMatch || !urlMatch[1]) {
    throw new Error(`Failed to extract image URL from response: ${content}`);
  }
  
  const imageUrl = urlMatch[1];

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
