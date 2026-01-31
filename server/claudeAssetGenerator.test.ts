import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateAssetsWithClaude } from "./claudeAssetGenerator";
import * as claude from "./_core/claude";
import * as imageGeneration from "./_core/imageGeneration";

// Mock dependencies
vi.mock("./_core/claude");
vi.mock("./_core/imageGeneration");

describe("Claude Asset Generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate all 6 images and website HTML", async () => {
    // Mock Claude analysis
    const mockAnalysis = {
      brandStrategy: {
        personality: "playful, community-driven",
        targetAudience: "crypto natives aged 18-35",
        coreMessage: "Test meme coin",
        visualStyle: "vibrant cartoon",
      },
      colorScheme: {
        primary: "#FF6B35",
        secondary: "#004E89",
        accent: "#F7B801",
      },
      websiteContent: {
        headline: "Test Headline",
        tagline: "Test Tagline",
        about: "Test About",
        features: ["Feature 1", "Feature 2", "Feature 3"],
        tokenomics: {
          totalSupply: "1,000,000,000",
          distribution: "50% Community, 50% Team",
        },
      },
      paydexBannerPrompt: "PayDex banner prompt",
      xBannerPrompt: "X banner prompt",
      logoPrompt: "Logo prompt",
      heroBackgroundPrompt: "Hero background prompt",
      communityScenePrompt: "Community scene prompt",
      featureIconPrompts: ["Icon 1 prompt", "Icon 2 prompt", "Icon 3 prompt"],
    };

    vi.mocked(claude.analyzeProjectInput).mockResolvedValue(mockAnalysis);

    // Mock image generation
    const mockImageResult = {
      url: "https://example.com/image.png",
      key: "test-key",
    };

    vi.mocked(imageGeneration.generateImage).mockResolvedValue(mockImageResult);

    // Mock website code generation
    const mockWebsiteHTML = "<html><body>Test Website</body></html>";
    vi.mocked(claude.generateWebsiteCode).mockResolvedValue(mockWebsiteHTML);

    // Execute
    const result = await generateAssetsWithClaude(
      "TestCoin",
      "TEST",
      "A test meme coin",
      "https://example.com/meme.png",
      1
    );

    // Verify Claude analysis was called
    expect(claude.analyzeProjectInput).toHaveBeenCalledWith({
      projectName: "TestCoin",
      ticker: "TEST",
      description: "A test meme coin",
      memeImageUrl: "https://example.com/meme.png",
    });

    // Verify 8 images were generated (PayDex Banner, X Banner, Logo, Hero Background, Community Scene, 3 Feature Icons)
    expect(imageGeneration.generateImage).toHaveBeenCalledTimes(8);

    // Verify PayDex Banner generation
    expect(imageGeneration.generateImage).toHaveBeenCalledWith({
      prompt: "PayDex banner prompt",
      size: "1500x500",
    });

    // Verify X Banner generation
    expect(imageGeneration.generateImage).toHaveBeenCalledWith({
      prompt: "X banner prompt",
      size: "1200x480",
    });

    // Verify Logo generation
    expect(imageGeneration.generateImage).toHaveBeenCalledWith({
      prompt: "Logo prompt",
      size: "512x512",
    });

    // Verify Hero Background generation
    expect(imageGeneration.generateImage).toHaveBeenCalledWith({
      prompt: "Hero background prompt",
      size: "1920x1080",
    });

    // Verify Community Scene generation
    expect(imageGeneration.generateImage).toHaveBeenCalledWith({
      prompt: "Community scene prompt",
      size: "800x600",
    });

    // Verify Feature Icons generation (3 icons)
    expect(imageGeneration.generateImage).toHaveBeenCalledWith({
      prompt: "Icon 1 prompt",
      size: "256x256",
    });

    // Verify website code generation was called with all images
    expect(claude.generateWebsiteCode).toHaveBeenCalledWith({
      projectName: "TestCoin",
      ticker: "TEST",
      description: "A test meme coin",
      brandStrategy: mockAnalysis.brandStrategy,
      colorScheme: mockAnalysis.colorScheme,
      websiteContent: mockAnalysis.websiteContent,
      paydexBannerUrl: mockImageResult.url,
      xBannerUrl: mockImageResult.url,
      logoUrl: mockImageResult.url,
      heroBackgroundUrl: mockImageResult.url,
      featureIconUrls: [mockImageResult.url, mockImageResult.url, mockImageResult.url],
      communitySceneUrl: mockImageResult.url,
    });

    // Verify result structure
    expect(result).toEqual({
      paydexBanner: {
        url: mockImageResult.url,
        key: "projects/1/paydex_banner.png",
      },
      xBanner: {
        url: mockImageResult.url,
        key: "projects/1/x_banner.png",
      },
      logo: {
        url: mockImageResult.url,
        key: "projects/1/logo.png",
      },
      heroBackground: {
        url: mockImageResult.url,
        key: "projects/1/hero_background.png",
      },
      featureIcons: [
        { url: mockImageResult.url, key: "projects/1/feature_icon_1.png" },
        { url: mockImageResult.url, key: "projects/1/feature_icon_2.png" },
        { url: mockImageResult.url, key: "projects/1/feature_icon_3.png" },
      ],
      communityScene: {
        url: mockImageResult.url,
        key: "projects/1/community_scene.png",
      },
      websiteHTML: mockWebsiteHTML,
      brandStrategy: mockAnalysis.brandStrategy,
      colorScheme: mockAnalysis.colorScheme,
      websiteContent: mockAnalysis.websiteContent,
    });
  });

  it("should handle errors gracefully", async () => {
    // Mock Claude analysis failure
    vi.mocked(claude.analyzeProjectInput).mockRejectedValue(new Error("Claude API error"));

    // Execute and expect error
    await expect(
      generateAssetsWithClaude(
        "TestCoin",
        "TEST",
        "A test meme coin",
        "https://example.com/meme.png",
        1
      )
    ).rejects.toThrow("Claude API error");
  });
});
