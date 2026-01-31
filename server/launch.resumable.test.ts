/**
 * Integration test for end-to-end resumable generation
 * Tests the complete fault tolerance system with module-level recovery
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import * as db from "./db";
import { executeLaunch, type LaunchInput } from "./launch";
import { getGenerationProgress, markModuleCompleted } from "./resumableGeneration";
import * as claude from "./_core/claude";
import * as imageGeneration from "./_core/imageGeneration";

describe("Launch - End-to-End Resumable Generation", () => {
  let testProjectId: number;
  let testUserId: number;

  beforeAll(async () => {
    // Create a test user
    const openId = `test-launch-resumable-${Date.now()}`;
    await db.upsertUser({
      openId,
      name: "Test User for Launch Resumable",
      email: "test-launch-resumable@example.com",
    });
    const user = await db.getUserByOpenId(openId);
    if (!user) {
      throw new Error("Failed to create test user");
    }
    testUserId = user.id;

    // Create a test project
    const project = await db.createProject({
      userId: testUserId,
      name: "Test Resumable Launch",
      description: "Testing end-to-end resumable generation",
      ticker: "TESTLAUNCH",
      status: "draft",
    });
    testProjectId = project.id;
  });

  afterAll(async () => {
    // Restore original functions
    vi.restoreAllMocks();
  });

  it("should resume from IMAGES module when ANALYSIS is already completed", async () => {
    // Mock Claude analysis to return immediately
    const mockAnalysisResult = {
      brandStrategy: {
        personality: "Fun and energetic",
        targetAudience: "Crypto enthusiasts",
        coreMessage: "Test message",
        visualStyle: "Modern and vibrant",
      },
      colorScheme: {
        primary: "#00FF00",
        secondary: "#0000FF",
        accent: "#FF00FF",
      },
      websiteContent: {
        headline: "Test Headline",
        tagline: "Test Tagline",
        about: "Test About",
        features: ["Feature 1", "Feature 2", "Feature 3"],
        tokenomics: {
          totalSupply: "1,000,000,000",
          distribution: "50% Liquidity, 30% Marketing, 20% Team",
        },
      },
      language: "en",
      paydexBannerPrompt: "Test PayDex Banner Prompt",
      xBannerPrompt: "Test X Banner Prompt",
      logoPrompt: "Test Logo Prompt",
      heroBackgroundPrompt: "Test Hero Background Prompt",
      communityScenePrompt: "Test Community Scene Prompt",
      featureIconPrompts: ["Icon 1", "Icon 2", "Icon 3"],
    };

    vi.spyOn(claude, "analyzeProjectInput").mockResolvedValue(mockAnalysisResult);

    // Mock image generation to fail (to test resumability)
    let imageCallCount = 0;
    vi.spyOn(imageGeneration, "generateImage").mockImplementation(async () => {
      imageCallCount++;
      if (imageCallCount <= 3) {
        // First 3 images succeed
        return {
          url: `https://example.com/test-image-${imageCallCount}.png`,
        };
      } else {
        // 4th image fails to test retry
        throw new Error("Simulated image generation failure");
      }
    });

    // Mock website code generation
    vi.spyOn(claude, "generateWebsiteCode").mockResolvedValue("<html>Test Website</html>");

    // Step 1: Run generation - should fail at IMAGES module
    const input: LaunchInput = {
      projectId: testProjectId,
      name: "Test Resumable Launch",
      description: "Testing resumable generation",
      ticker: "TESTLAUNCH",
    };

    const result1 = await executeLaunch(input);
    
    // Verify it failed
    expect(result1.status).toBe("failed");
    expect(result1.error).toContain("IMAGES module failed");

    // Verify ANALYSIS module was completed
    const progress1 = await getGenerationProgress(testProjectId);
    expect(progress1?.completedModules).toContain("analysis");
    expect(progress1?.failedModule).toBe("images");

    // Verify analysis data was saved
    const assets1 = await db.getAssetsByProjectId(testProjectId);
    const websiteAsset1 = assets1.find(a => a.assetType === "website");
    expect(websiteAsset1).toBeDefined();
    expect(websiteAsset1?.metadata?.analysis).toBeDefined();

    // Step 2: Fix the mock and retry - should resume from IMAGES module
    imageCallCount = 0; // Reset counter
    vi.spyOn(imageGeneration, "generateImage").mockResolvedValue({
      url: "https://example.com/test-image-success.png",
    });

    const result2 = await executeLaunch(input);

    // Verify it succeeded
    expect(result2.status).toBe("completed");
    expect(result2.assets.paydexBanner).toBeDefined();
    expect(result2.assets.website).toBeDefined();

    // Verify all modules completed
    const progress2 = await getGenerationProgress(testProjectId);
    expect(progress2?.completedModules).toContain("analysis");
    expect(progress2?.completedModules).toContain("images");
    expect(progress2?.completedModules).toContain("website_code");

    // Verify Claude analysis was NOT called again (resumed from checkpoint)
    expect(claude.analyzeProjectInput).toHaveBeenCalledTimes(1);
  }, 30000);

  it("should resume from WEBSITE_CODE module when ANALYSIS and IMAGES are completed", async () => {
    // Create a new test project
    const project2 = await db.createProject({
      userId: testUserId,
      name: "Test Resume Website",
      description: "Testing website code resumption",
      ticker: "TESTWEB",
      status: "draft",
    });

    // Mock functions
    const mockAnalysisResult = {
      brandStrategy: { personality: "Test", targetAudience: "Test", coreMessage: "Test", visualStyle: "Test" },
      colorScheme: { primary: "#00FF00", secondary: "#0000FF", accent: "#FF00FF" },
      websiteContent: {
        headline: "Test",
        tagline: "Test",
        about: "Test",
        features: ["F1", "F2", "F3"],
        tokenomics: { totalSupply: "1B", distribution: "Test" },
      },
      language: "en",
      paydexBannerPrompt: "Test",
      xBannerPrompt: "Test",
      logoPrompt: "Test",
      heroBackgroundPrompt: "Test",
      communityScenePrompt: "Test",
      featureIconPrompts: ["I1", "I2", "I3"],
    };

    vi.spyOn(claude, "analyzeProjectInput").mockResolvedValue(mockAnalysisResult);
    vi.spyOn(imageGeneration, "generateImage").mockResolvedValue({
      url: "https://example.com/test-image.png",
    });

    let websiteCallCount = 0;
    vi.spyOn(claude, "generateWebsiteCode").mockImplementation(async () => {
      websiteCallCount++;
      // Fail 4 times to exceed retry limit (maxRetries=3 means 4 total attempts: 1 initial + 3 retries)
      if (websiteCallCount <= 4) {
        throw new Error("Simulated website generation failure");
      }
      return "<html>Test Website Success</html>";
    });

    // Step 1: Run generation - should fail at WEBSITE_CODE module after 3 retries
    const input: LaunchInput = {
      projectId: project2.id,
      name: "Test Resume Website",
      description: "Testing website code resumption",
      ticker: "TESTWEB",
    };

    const result1 = await executeLaunch(input);
    
    // Verify it failed at WEBSITE_CODE after 3 retries
    expect(result1.status).toBe("failed");
    expect(result1.error).toContain("WEBSITE_CODE module failed");
    expect(websiteCallCount).toBe(4); // Should have tried 4 times (1 initial + 3 retries)

    const progress1 = await getGenerationProgress(project2.id);
    expect(progress1?.completedModules).toContain("analysis");
    expect(progress1?.completedModules).toContain("images");
    expect(progress1?.failedModule).toBe("website_code");

    // Step 2: Retry - should resume from WEBSITE_CODE module and succeed
    websiteCallCount = 0; // Reset counter
    vi.spyOn(claude, "generateWebsiteCode").mockResolvedValue("<html>Test Website Success</html>");
    
    const result2 = await executeLaunch(input);

    // Verify it succeeded
    expect(result2.status).toBe("completed");
    expect(result2.assets.website).toBeDefined();

    // Verify modules were not re-executed
    // analyzeProjectInput called once in first attempt, not called in second attempt
    expect(imageGeneration.generateImage).toHaveBeenCalledTimes(8); // 8 images, only called once

    // Verify all modules completed
    const progress2 = await getGenerationProgress(project2.id);
    expect(progress2?.completedModules).toHaveLength(3);
  }, 30000);
});
