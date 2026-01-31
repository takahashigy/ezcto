/**
 * Test suite for deleting generation history functionality
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as db from "./db";
import { InsertUser, InsertProject, InsertGenerationHistory } from "../drizzle/schema";

describe("Delete Generation History", () => {
  let testUser: InsertUser;
  let testProject: InsertProject;
  let testHistory: InsertGenerationHistory;

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

    // Create test project
    testProject = {
      userId: user.id,
      name: "Test Project for History Delete",
      ticker: "TEST",
      description: "Test project description",
      status: "completed",
    };
    const project = await db.createProject(testProject);
    const projectId = project.id;

    // Create test generation history
    testHistory = {
      projectId,
      userId: user.id,
      status: "completed",
      startTime: new Date(),
      endTime: new Date(),
      durationMs: 5000,
      assetsGenerated: {
        logo: "https://example.com/logo.png",
        banner: "https://example.com/banner.png",
        pfp: "https://example.com/pfp.png",
        poster: "https://example.com/poster.png",
        narrative: true,
        website: true,
      },
    };
  });

  it("should create and retrieve generation history", async () => {
    const created = await db.createGenerationHistory(testHistory);
    
    expect(created).toBeDefined();
    expect(created.id).toBeGreaterThan(0);
    expect(created.projectId).toBe(testHistory.projectId);
    expect(created.userId).toBe(testHistory.userId);
    expect(created.status).toBe("completed");

    const retrieved = await db.getGenerationHistoryById(created.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(created.id);
  });

  it("should delete generation history by id", async () => {
    const created = await db.createGenerationHistory(testHistory);
    
    // Verify it exists
    const beforeDelete = await db.getGenerationHistoryById(created.id);
    expect(beforeDelete).toBeDefined();

    // Delete it
    await db.deleteGenerationHistory(created.id);

    // Verify it's gone
    const afterDelete = await db.getGenerationHistoryById(created.id);
    expect(afterDelete).toBeUndefined();
  });

  it("should get generation history by user id", async () => {
    const created1 = await db.createGenerationHistory(testHistory);
    const created2 = await db.createGenerationHistory({
      ...testHistory,
      status: "failed",
      errorMessage: "Test error",
    });

    const history = await db.getGenerationHistoryByUserId(testHistory.userId!, 10);
    
    expect(history.length).toBeGreaterThanOrEqual(2);
    const ids = history.map(h => h.id);
    expect(ids).toContain(created1.id);
    expect(ids).toContain(created2.id);
  });

  it("should get generation history by project id", async () => {
    const created = await db.createGenerationHistory(testHistory);

    const history = await db.getGenerationHistoryByProjectId(testHistory.projectId!);
    
    expect(history.length).toBeGreaterThan(0);
    const found = history.find(h => h.id === created.id);
    expect(found).toBeDefined();
    expect(found?.projectId).toBe(testHistory.projectId);
  });

  it("should handle deleting non-existent history gracefully", async () => {
    const nonExistentId = 999999;
    
    // Should not throw error
    await expect(db.deleteGenerationHistory(nonExistentId)).resolves.not.toThrow();
  });

  it("should update generation history status", async () => {
    const created = await db.createGenerationHistory({
      ...testHistory,
      status: "generating",
    });

    await db.updateGenerationHistory(created.id, {
      status: "completed",
      endTime: new Date(),
      durationMs: 10000,
    });

    const updated = await db.getGenerationHistoryById(created.id);
    expect(updated?.status).toBe("completed");
    expect(updated?.durationMs).toBe(10000);
  });

  it("should order history by creation time (newest first)", async () => {
    // Create multiple history records with delays
    const history1 = await db.createGenerationHistory(testHistory);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const history2 = await db.createGenerationHistory({
      ...testHistory,
      status: "failed",
    });
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const history3 = await db.createGenerationHistory({
      ...testHistory,
      status: "generating",
    });

    // Use projectId to query only this project's history
    const projectHistory = await db.getGenerationHistoryByProjectId(testHistory.projectId!);
    
    // Verify we have all 3 records
    expect(projectHistory.length).toBeGreaterThanOrEqual(3);
    
    // Find our 3 records in the results
    const ourRecords = projectHistory.filter(h => 
      [history1.id, history2.id, history3.id].includes(h.id)
    );
    
    expect(ourRecords.length).toBe(3);
    
    // Newest should be first
    expect(ourRecords[0].id).toBe(history3.id);
    expect(ourRecords[1].id).toBe(history2.id);
    expect(ourRecords[2].id).toBe(history1.id);
  });
});
