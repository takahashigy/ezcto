/**
 * Claude-Coordinated Asset Generator
 * Uses Claude Opus 4.5 to analyze user input and coordinate multi-asset generation
 * Generates 6 images: PayDex Banner, X Banner, Logo, Hero Background, Feature Icons (3), Community Scene
 */

import { analyzeProjectInput, generateWebsiteCode } from "./_core/claude";
import { generateImage } from "./_core/imageGeneration";

export interface ClaudeGeneratedAssets {
  // Marketing assets (for user download)
  paydexBanner: {
    url: string;
    key: string;
  };
  xBanner: {
    url: string;
    key: string;
  };
  logo: {
    url: string;
    key: string;
  };
  // Website decoration assets
  heroBackground: {
    url: string;
    key: string;
  };
  featureIcons: Array<{
    url: string;
    key: string;
  }>;
  communityScene: {
    url: string;
    key: string;
  };
  // Website HTML
  websiteHTML: string;
  // Brand strategy and content
  brandStrategy: {
    personality: string;
    targetAudience: string;
    coreMessage: string;
    visualStyle: string;
  };
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  websiteContent: {
    headline: string;
    tagline: string;
    about: string;
    features: string[];
    tokenomics: {
      totalSupply: string;
      distribution: string;
    };
  };
}

/**
 * Generate all assets using Claude Opus coordination
 */
export async function generateAssetsWithClaude(
  projectName: string,
  ticker: string,
  description: string,
  memeImageUrl: string | undefined,
  projectId: number
): Promise<ClaudeGeneratedAssets> {
  console.log(`[ClaudeAssetGenerator] Starting Claude-coordinated generation for project ${projectId}`);

  // Step 1: Claude Opus analyzes input and generates comprehensive strategy + prompts
  console.log(`[ClaudeAssetGenerator] Claude Opus analyzing project input...`);
  const analysis = await analyzeProjectInput({
    projectName,
    ticker,
    description,
    memeImageUrl,
  });
  console.log(`[ClaudeAssetGenerator] Claude Opus analysis complete:`, JSON.stringify(analysis, null, 2));

  // Step 2: Generate all images in parallel with Nanobanana using Claude's optimized prompts
  console.log(`[ClaudeAssetGenerator] Generating 6 images in parallel with Nanobanana...`);
  
  const imageGenerationPromises = [
    // Marketing assets
    generateImage({
      prompt: analysis.paydexBannerPrompt,
      size: "1500x500",
    }).then(result => ({ type: 'paydexBanner', result })),
    
    generateImage({
      prompt: analysis.xBannerPrompt,
      size: "1200x480",
    }).then(result => ({ type: 'xBanner', result })),
    
    generateImage({
      prompt: analysis.logoPrompt,
      size: "512x512",
    }).then(result => ({ type: 'logo', result })),
    
    // Website decoration assets
    generateImage({
      prompt: analysis.heroBackgroundPrompt,
      size: "1920x1080",
    }).then(result => ({ type: 'heroBackground', result })),
    
    generateImage({
      prompt: analysis.communityScenePrompt,
      size: "800x600",
    }).then(result => ({ type: 'communityScene', result })),
    
    // Feature icons (3 icons in parallel)
    ...analysis.featureIconPrompts.map((prompt, index) =>
      generateImage({
        prompt,
        size: "256x256",
      }).then(result => ({ type: 'featureIcon', index, result }))
    ),
  ];

  const imageResults = await Promise.all(imageGenerationPromises);
  console.log(`[ClaudeAssetGenerator] All images generated successfully`);

  // Organize results
  const paydexBanner = imageResults.find(r => r.type === 'paydexBanner')!.result;
  const xBanner = imageResults.find(r => r.type === 'xBanner')!.result;
  const logo = imageResults.find(r => r.type === 'logo')!.result;
  const heroBackground = imageResults.find(r => r.type === 'heroBackground')!.result;
  const communityScene = imageResults.find(r => r.type === 'communityScene')!.result;
  const featureIconResults = imageResults
    .filter(r => r.type === 'featureIcon')
    .sort((a, b) => (a as any).index - (b as any).index)
    .map(r => r.result);

  // Step 3: Claude Opus generates website code using all generated images
  console.log(`[ClaudeAssetGenerator] Claude Opus generating website code...`);
  const websiteHTML = await generateWebsiteCode({
    projectName,
    ticker,
    description,
    language: analysis.language, // Pass detected language
    brandStrategy: analysis.brandStrategy,
    colorScheme: analysis.colorScheme,
    websiteContent: analysis.websiteContent,
    paydexBannerUrl: paydexBanner.url!,
    xBannerUrl: xBanner.url!,
    logoUrl: logo.url!,
    heroBackgroundUrl: heroBackground.url!,
    featureIconUrls: featureIconResults.map(r => r.url!),
    communitySceneUrl: communityScene.url!,
  });
  console.log(`[ClaudeAssetGenerator] Website code generated (${websiteHTML.length} chars)`);

  return {
    paydexBanner: {
      url: paydexBanner.url!,
      key: `projects/${projectId}/paydex_banner.png`,
    },
    xBanner: {
      url: xBanner.url!,
      key: `projects/${projectId}/x_banner.png`,
    },
    logo: {
      url: logo.url!,
      key: `projects/${projectId}/logo.png`,
    },
    heroBackground: {
      url: heroBackground.url!,
      key: `projects/${projectId}/hero_background.png`,
    },
    featureIcons: featureIconResults.map((result, index) => ({
      url: result.url!,
      key: `projects/${projectId}/feature_icon_${index + 1}.png`,
    })),
    communityScene: {
      url: communityScene.url!,
      key: `projects/${projectId}/community_scene.png`,
    },
    websiteHTML,
    brandStrategy: analysis.brandStrategy,
    colorScheme: analysis.colorScheme,
    websiteContent: analysis.websiteContent,
  };
}
