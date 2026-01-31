/**
 * Claude-Coordinated Asset Generator
 * Uses Claude 3.7 Sonnet to analyze user input and coordinate multi-model asset generation
 */

import { analyzeProjectInput, generateWebsiteCode } from "./_core/claude";
import { generateImage } from "./_core/imageGeneration";
import { storagePut } from "./storage";

export interface ClaudeGeneratedAssets {
  banner: {
    url: string;
    key: string;
  };
  logo: {
    url: string;
    key: string;
  };
  poster: {
    url: string;
    key: string;
  };
  websiteHTML: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    style: string;
  };
  content: {
    headline: string;
    tagline: string;
    features: string[];
  };
}

/**
 * Generate all assets using Claude coordination
 */
export async function generateAssetsWithClaude(
  projectName: string,
  ticker: string,
  description: string,
  memeImageUrl: string | undefined,
  projectId: number
): Promise<ClaudeGeneratedAssets> {
  console.log(`[ClaudeAssetGenerator] Starting Claude-coordinated generation for project ${projectId}`);

  // Step 1: Claude analyzes input and generates optimized prompts
  console.log(`[ClaudeAssetGenerator] Claude analyzing project input...`);
  const analysis = await analyzeProjectInput({
    projectName,
    ticker,
    description,
    memeImageUrl,
  });
  console.log(`[ClaudeAssetGenerator] Claude analysis complete:`, JSON.stringify(analysis, null, 2));

  // Step 2: Generate images with Nanobanana using Claude's optimized prompts
  console.log(`[ClaudeAssetGenerator] Generating banner with Nanobanana...`);
  const bannerResult = await generateImage({
    prompt: analysis.bannerPrompt,
  });
  
  console.log(`[ClaudeAssetGenerator] Generating logo with Nanobanana...`);
  const logoResult = await generateImage({
    prompt: analysis.logoPrompt,
  });
  
  console.log(`[ClaudeAssetGenerator] Generating poster with Nanobanana...`);
  const posterResult = await generateImage({
    prompt: analysis.posterPrompt,
  });

  // Step 3: Claude generates website code
  console.log(`[ClaudeAssetGenerator] Claude generating website code...`);
  const websiteHTML = await generateWebsiteCode({
    projectName,
    ticker,
    description,
    theme: analysis.websiteTheme,
    content: analysis.contentSuggestions,
    bannerUrl: bannerResult.url!,
    logoUrl: logoResult.url!,
    posterUrl: posterResult.url!,
  });
  console.log(`[ClaudeAssetGenerator] Website code generated (${websiteHTML.length} chars)`);

  return {
    banner: {
      url: bannerResult.url!,
      key: `projects/${projectId}/banner.png`,
    },
    logo: {
      url: logoResult.url!,
      key: `projects/${projectId}/logo.png`,
    },
    poster: {
      url: posterResult.url!,
      key: `projects/${projectId}/poster.png`,
    },
    websiteHTML,
    theme: analysis.websiteTheme,
    content: analysis.contentSuggestions,
  };
}
