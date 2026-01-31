/**
 * Test suite for deleting project functionality
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as db from "./db";
import { InsertUser, InsertProject, InsertAsset, InsertGenerationHistory } from "../drizzle/schema";

describe("Delete Project", () => {
  let testUser: InsertUser;
  let testProject: InsertProject;
  let projectId: number;
  let userId: number;

  beforeEach(async () => {
    // Create test user
    testUser = {
      openId: `test-user-${Date.now()}-${Math.random()}`,
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
    };
    await db.upsertUser(testUser);
    const user = await db.getUserByOpenId(testUser.openId);
    if (!user) throw new Error("Failed to create test user");
    userId = user.id;

    // Create test project
    testProject = {
      userId: user.id,
      name: "Test Project for Deletion",
      ticker: "TEST",
      description: "Test project description",
      status: "completed",
    };
    const project = await db.createProject(testProject);
    projectId = project.id;
  });

  it("should delete project and all related data", async () => {
    // Create related assets
    const asset1: InsertAsset = {
      projectId,
      assetType: "logo",
      fileUrl: "https://example.com/logo.png",
      fileKey: "test/logo.png",
    };
    const asset2: InsertAsset = {
      projectId,
      assetType: "banner",
      fileUrl: "https://example.com/banner.png",
      fileKey: "test/banner.png",
    };
    await db.createAsset(asset1);
    await db.createAsset(asset2);

    // Create generation history
    const history: InsertGenerationHistory = {
      projectId,
      userId,
      status: "completed",
      startTime: new Date(),
      endTime: new Date(),
      durationMs: 5000,
      assetsGenerated: {
        logo: "https://example.com/logo.png",
        banner: "https://example.com/banner.png",
      },
    };
    await db.createGenerationHistory(history);

    // Verify everything exists
    const projectBefore = await db.getProjectById(projectId);
    expect(projectBefore).toBeDefined();

    const assetsBefore = await db.getAssetsByProjectId(projectId);
    expect(assetsBefore.length).toBe(2);

    const historyBefore = await db.getGenerationHistoryByProjectId(projectId);
    expect(historyBefore.length).toBeGreaterThan(0);

    // Delete the project
    await db.deleteProject(projectId);

    // Verify everything is deleted
    const projectAfter = await db.getProjectById(projectId);
    expect(projectAfter).toBeUndefined();

    const assetsAfter = await db.getAssetsByProjectId(projectId);
    expect(assetsAfter.length).toBe(0);

    const historyAfter = await db.getGenerationHistoryByProjectId(projectId);
    expect(historyAfter.length).toBe(0);
  });

  it("should handle deleting project with no assets or history", async () => {
    // Verify project exists
    const projectBefore = await db.getProjectById(projectId);
    expect(projectBefore).toBeDefined();

    // Delete the project (no assets or history)
    await db.deleteProject(projectId);

    // Verify project is deleted
    const projectAfter = await db.getProjectById(projectId);
    expect(projectAfter).toBeUndefined();
  });

  it("should handle deleting non-existent project gracefully", async () => {
    const nonExistentId = 999999;

    // Should not throw error
    await expect(db.deleteProject(nonExistentId)).resolves.not.toThrow();
  });

  it("should delete only the specified project", async () => {
    // Create another project
    const anotherProject = await db.createProject({
      userId,
      name: "Another Project",
      ticker: "TEST2",
      description: "Another project",
      status: "draft",
    });

    // Verify both projects exist before deletion
    const project1Before = await db.getProjectById(projectId);
    const project2Before = await db.getProjectById(anotherProject.id);
    expect(project1Before).toBeDefined();
    expect(project2Before).toBeDefined();
    expect(project1Before?.id).toBe(projectId);
    expect(project2Before?.id).toBe(anotherProject.id);

    // Delete the first project
    await db.deleteProject(projectId);

    // Verify first project is deleted
    const deletedProject = await db.getProjectById(projectId);
    expect(deletedProject).toBeUndefined();

    // Verify second project still exists
    const existingProject = await db.getProjectById(anotherProject.id);
    expect(existingProject).toBeDefined();
    expect(existingProject?.name).toBe("Another Project");
    expect(existingProject?.id).toBe(anotherProject.id);
  });

  it("should delete multiple assets associated with project", async () => {
    // Create multiple assets
    const assetTypes = ["logo", "banner", "pfp", "poster", "website"] as const;
    for (const type of assetTypes) {
      await db.createAsset({
        projectId,
        assetType: type,
        fileUrl: `https://example.com/${type}.png`,
        fileKey: `test/${type}.png`,
      });
    }

    // Verify all assets exist
    const assetsBefore = await db.getAssetsByProjectId(projectId);
    expect(assetsBefore.length).toBe(5);

    // Delete the project
    await db.deleteProject(projectId);

    // Verify all assets are deleted
    const assetsAfter = await db.getAssetsByProjectId(projectId);
    expect(assetsAfter.length).toBe(0);
  });

  it("should delete multiple generation history records", async () => {
    // Create multiple history records
    for (let i = 0; i < 3; i++) {
      await db.createGenerationHistory({
        projectId,
        userId,
        status: i === 0 ? "completed" : i === 1 ? "failed" : "generating",
        startTime: new Date(),
        endTime: i < 2 ? new Date() : undefined,
        durationMs: i < 2 ? 5000 : undefined,
        assetsGenerated: {
          logo: "https://example.com/logo.png",
        },
      });
      // Add delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Verify all history records exist
    const historyBefore = await db.getGenerationHistoryByProjectId(projectId);
    expect(historyBefore.length).toBe(3);

    // Delete the project
    await db.deleteProject(projectId);

    // Verify all history records are deleted
    const historyAfter = await db.getGenerationHistoryByProjectId(projectId);
    expect(historyAfter.length).toBe(0);
  });
});
