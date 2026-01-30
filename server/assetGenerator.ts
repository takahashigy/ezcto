/**
 * Asset Generator
 * Generates visual assets (Banner, Logo variants) based on user's meme image
 */

import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";
import type { ProjectAnalysis } from "./aiAnalyzer";

export interface GeneratedAssets {
  banner: {
    url: string;
    key: string;
  };
  logoVariants: {
    original: { url: string; key: string };
    square512: { url: string; key: string };
    square256: { url: string; key: string };
  };
}

/**
 * Generate all visual assets for a project
 */
export async function generateProjectAssets(
  projectName: string,
  ticker: string,
  description: string,
  originalMemeUrl: string,
  analysis: ProjectAnalysis,
  projectId: number
): Promise<GeneratedAssets> {
  console.log(`[AssetGenerator] Starting asset generation for project ${projectId}`);

  // Generate Banner (1500x500)
  const banner = await generateBanner(
    projectName,
    ticker,
    description,
    originalMemeUrl,
    analysis,
    projectId
  );

  // For logo variants, we'll use the original meme image
  // In a production system, you might want to generate optimized versions
  const logoVariants = {
    original: { url: originalMemeUrl, key: "" },
    square512: { url: originalMemeUrl, key: "" },
    square256: { url: originalMemeUrl, key: "" },
  };

  console.log(`[AssetGenerator] Asset generation completed for project ${projectId}`);

  return {
    banner,
    logoVariants,
  };
}

/**
 * Generate banner image (1500x500)
 */
async function generateBanner(
  projectName: string,
  ticker: string,
  description: string,
  originalMemeUrl: string,
  analysis: ProjectAnalysis,
  projectId: number
): Promise<{ url: string; key: string }> {
  console.log(`[AssetGenerator] Generating banner for ${projectName}`);

  const { layoutStyle, vibe, colorPalette } = analysis;

  // Build style-specific prompt
  let stylePrompt = "";
  if (layoutStyle === "minimal") {
    stylePrompt = "clean, minimalist design with lots of whitespace, simple and elegant";
  } else if (layoutStyle === "playful") {
    stylePrompt = "fun, colorful, hand-drawn elements, playful and energetic";
  } else if (layoutStyle === "cyberpunk") {
    stylePrompt = "dark, neon lights, futuristic, cyberpunk aesthetic with glowing effects";
  } else if (layoutStyle === "retro") {
    stylePrompt = "nostalgic, pixel art style, retro gaming aesthetic, 8-bit inspired";
  }

  // Build vibe-specific prompt
  let vibePrompt = "";
  if (vibe === "friendly") {
    vibePrompt = "warm, welcoming, approachable atmosphere";
  } else if (vibe === "edgy") {
    vibePrompt = "bold, rebellious, provocative energy";
  } else if (vibe === "mysterious") {
    vibePrompt = "dark, intriguing, enigmatic mood";
  } else if (vibe === "energetic") {
    vibePrompt = "dynamic, exciting, high-energy feel";
  }

  const prompt = `Create a banner image (1500x500) for "${projectName}" ($${ticker}), a meme cryptocurrency project.

Style: ${stylePrompt}
Mood: ${vibePrompt}
Colors: Use ${colorPalette.primary} as primary color, ${colorPalette.secondary} as accent color

The banner should:
- Feature the character/meme from the reference image as the main focus
- Include the project name "${projectName}" in bold, eye-catching typography
- Match the ${layoutStyle} aesthetic
- Be optimized for social media sharing (Twitter, Telegram)
- Have a ${vibe} vibe

DO NOT include any text other than the project name.
Make it visually striking and memorable.`;

  try {
    const { url: generatedUrl } = await generateImage({
      prompt,
      originalImages: [
        {
          url: originalMemeUrl,
          mimeType: "image/png",
        },
      ],
    });

    // Download and re-upload to our S3 with proper naming
    if (!generatedUrl) {
      throw new Error("Failed to generate banner: no URL returned");
    }
    const response = await fetch(generatedUrl);
    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    const fileKey = `projects/${projectId}/banner-${Date.now()}.png`;
    const { url, key } = await storagePut(fileKey, uint8Array, "image/png");

    console.log(`[AssetGenerator] Banner generated successfully: ${url}`);

    return { url, key };
  } catch (error) {
    console.error(`[AssetGenerator] Banner generation failed:`, error);
    // Fallback: use original image as banner
    return { url: originalMemeUrl, key: "" };
  }
}

/**
 * Generate multiple logo variants (different sizes)
 * In a production system, you would use image processing libraries
 * For now, we'll just return the original image
 */
export async function generateLogoVariants(
  originalUrl: string,
  projectId: number
): Promise<GeneratedAssets["logoVariants"]> {
  // TODO: Implement actual image resizing
  // For MVP, return original image for all variants
  return {
    original: { url: originalUrl, key: "" },
    square512: { url: originalUrl, key: "" },
    square256: { url: originalUrl, key: "" },
  };
}
