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
  poster: {
    url: string;
    key: string;
  };
  // Website decoration assets
  heroBackground: {
    url: string;
    key: string;
  };
  featureIcon: {
    url: string;
    key: string;
  };
  // Website HTML
  websiteHTML: string;
  // Poster section content
  posterSectionContent: {
    title: string;
    description: string;
  };
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
export interface AssetGeneratedCallback {
  (assetType: string, assetData: { url: string; key: string }): Promise<void>;
}

export async function generateAssetsWithClaude(
  projectName: string,
  ticker: string,
  description: string,
  memeImageUrl?: string,
  projectId?: number,
  tokenomics?: string,
  onAssetGenerated?: AssetGeneratedCallback
): Promise<ClaudeGeneratedAssets> {
  console.log(`[ClaudeAssetGenerator] Starting Claude-coordinated generation for project ${projectId}`);

  // Step 1: Claude Opus analyzes input and generates comprehensive strategy + prompts
  console.log(`[ClaudeAssetGenerator] Claude Opus analyzing project input...`);
  const analysis = await analyzeProjectInput({
    projectName,
    ticker,
    description,
    memeImageUrl,
    tokenomics,
  });
  console.log(`[ClaudeAssetGenerator] Claude Opus analysis complete:`, JSON.stringify(analysis, null, 2));

  // Step 2: Generate all images in parallel with Nanobanana using Claude's optimized prompts
  console.log(`[ClaudeAssetGenerator] Generating 7 images in parallel with Nanobanana...`);
  
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
    
    // Poster (magazine-quality, 1080x1350 for social media and print)
    generateImage({
      prompt: analysis.posterPrompt,
      size: "1080x1350",
    }).then(result => ({ type: 'poster', result })),
    
    // Website decoration assets
    generateImage({
      prompt: analysis.heroBackgroundPrompt,
      size: "1920x1080",
    }).then(result => ({ type: 'heroBackground', result })),
    
    // Feature icon (single icon)
    generateImage({
      prompt: analysis.featureIconPrompt,
      size: "256x256",
    }).then(result => ({ type: 'featureIcon', result })),
  ];

  // Generate images and save incrementally
  const imageResults: any[] = [];
  for (const promise of imageGenerationPromises) {
    const result = await promise;
    imageResults.push(result);
    
    // Immediately save this asset if callback provided
    if (onAssetGenerated && projectId) {
      // Map internal type names to database enum values
      let assetType: string;
      if (result.type === 'paydexBanner') assetType = 'paydex_banner';
      else if (result.type === 'xBanner') assetType = 'x_banner';
      else if (result.type === 'heroBackground') assetType = 'hero_background';
      else if (result.type === 'communityScene') assetType = 'community_scene';
      else if (result.type === 'featureIcon') assetType = 'feature_icon';
      else assetType = result.type;
      const assetData = {
        url: result.result.url!,
        key: `projects/${projectId}/${assetType}.png`,
      };
      await onAssetGenerated(assetType, assetData);
      console.log(`[ClaudeAssetGenerator] Saved ${result.type} to database`);
    }
  }
  console.log(`[ClaudeAssetGenerator] All images generated and saved successfully`);

  // Organize results
  const paydexBanner = imageResults.find(r => r.type === 'paydexBanner')!.result;
  const xBanner = imageResults.find(r => r.type === 'xBanner')!.result;
  const logo = imageResults.find(r => r.type === 'logo')!.result;
  const poster = imageResults.find(r => r.type === 'poster')!.result;
  const heroBackground = imageResults.find(r => r.type === 'heroBackground')!.result;
  const featureIcon = imageResults.find(r => r.type === 'featureIcon')!.result;

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
    posterSectionContent: analysis.posterSectionContent, // Pass poster section content
    paydexBannerUrl: paydexBanner.url!,
    xBannerUrl: xBanner.url!,
    logoUrl: logo.url!,
    posterUrl: poster.url!, // Pass poster URL for website
    heroBackgroundUrl: heroBackground.url!,
    featureIconUrl: featureIcon.url!,
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
    poster: {
      url: poster.url!,
      key: `projects/${projectId}/poster.png`,
    },
    heroBackground: {
      url: heroBackground.url!,
      key: `projects/${projectId}/hero_background.png`,
    },
    featureIcon: {
      url: featureIcon.url!,
      key: `projects/${projectId}/feature_icon.png`,
    },
    websiteHTML,
    posterSectionContent: analysis.posterSectionContent,
    brandStrategy: analysis.brandStrategy,
    colorScheme: analysis.colorScheme,
    websiteContent: analysis.websiteContent,
  };
}
