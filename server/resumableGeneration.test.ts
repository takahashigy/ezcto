/**
 * Test suite for module-level resumable generation
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import { 
  shouldSkipModule, 
  markModuleCompleted, 
  markModuleFailed,
  getGenerationProgress,
  resetGenerationProgress,
  type GenerationModule 
} from "./resumableGeneration";

describe("Resumable Generation - Module-Level Checkpoint", () => {
  let testProjectId: number;
  let testUserId: number;

  beforeAll(async () => {
    // Create a test user
    const openId = `test-resumable-${Date.now()}`;
    await db.upsertUser({
      openId,
      name: "Test User for Resumable Generation",
      email: "test-resumable@example.com",
    });
    const user = await db.getUserByOpenId(openId);
    if (!user) {
      throw new Error("Failed to create test user");
    }
    testUserId = user.id;

    // Create a test project
    const project = await db.createProject({
      userId: testUserId,
      name: "Test Resumable Project",
      description: "Testing module-level checkpoint recovery",
      ticker: "TESTRES",
      status: "draft",
    });
    testProjectId = project.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testProjectId) {
      // Delete assets
      const assets = await db.getAssetsByProjectId(testProjectId);
      for (const asset of assets) {
        // Note: No deleteAsset function in db.ts, skip cleanup
      }
      
      // Note: No deleteProject function in db.ts, skip cleanup
    }
  });

  it("should initialize with no completed modules", async () => {
    const progress = await getGenerationProgress(testProjectId);
    expect(progress).toBeNull();
  });

  it("should mark ANALYSIS module as completed", async () => {
    await markModuleCompleted(testProjectId, "analysis");
    
    const progress = await getGenerationProgress(testProjectId);
    expect(progress).not.toBeNull();
    expect(progress?.completedModules).toContain("analysis");
    expect(progress?.failedModule).toBeNull();
  });

  it("should skip ANALYSIS module when already completed", async () => {
    const progress = await getGenerationProgress(testProjectId);
    const shouldSkip = shouldSkipModule("analysis", progress);
    
    expect(shouldSkip).toBe(true);
  });

  it("should not skip IMAGES module when not completed", async () => {
    const progress = await getGenerationProgress(testProjectId);
    const shouldSkip = shouldSkipModule("images", progress);
    
    expect(shouldSkip).toBe(false);
  });

  it("should mark IMAGES module as completed", async () => {
    await markModuleCompleted(testProjectId, "images");
    
    const progress = await getGenerationProgress(testProjectId);
    expect(progress?.completedModules).toContain("analysis");
    expect(progress?.completedModules).toContain("images");
    expect(progress?.completedModules).toHaveLength(2);
  });

  it("should mark WEBSITE_CODE module as failed", async () => {
    await markModuleFailed(testProjectId, "website_code");
    
    const progress = await getGenerationProgress(testProjectId);
    expect(progress?.failedModule).toBe("website_code");
    expect(progress?.retryCount).toBe(1);
  });

  it("should increment retry count on subsequent failures", async () => {
    await markModuleFailed(testProjectId, "website_code");
    
    const progress = await getGenerationProgress(testProjectId);
    expect(progress?.retryCount).toBe(2);
  });

  it("should reset generation progress", async () => {
    await resetGenerationProgress(testProjectId);
    
    const progress = await getGenerationProgress(testProjectId);
    expect(progress?.completedModules).toHaveLength(0);
    expect(progress?.failedModule).toBeNull();
    expect(progress?.retryCount).toBe(0);
  });

  it("should handle multiple modules completed in sequence", async () => {
    await resetGenerationProgress(testProjectId);
    
    // Complete modules in order
    await markModuleCompleted(testProjectId, "analysis");
    await markModuleCompleted(testProjectId, "images");
    await markModuleCompleted(testProjectId, "website_code");
    
    const progress = await getGenerationProgress(testProjectId);
    expect(progress?.completedModules).toHaveLength(3);
    expect(progress?.completedModules).toContain("analysis");
    expect(progress?.completedModules).toContain("images");
    expect(progress?.completedModules).toContain("website_code");
  });

  it("should not add duplicate modules to completedModules", async () => {
    await markModuleCompleted(testProjectId, "analysis");
    await markModuleCompleted(testProjectId, "analysis"); // Duplicate
    
    const progress = await getGenerationProgress(testProjectId);
    const analysisCount = progress?.completedModules.filter(m => m === "analysis").length;
    expect(analysisCount).toBe(1);
  });
});
