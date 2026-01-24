import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Generation History", () => {
  let testUserId: number;
  let testProjectId: number;

  beforeAll(async () => {
    // Create a test user
    const openId = `test-user-${Date.now()}`;
    await db.upsertUser({
      openId,
      name: "Test User",
      email: "test@example.com",
    });
    const user = await db.getUserByOpenId(openId);
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;

    // Create a test project
    const project = await db.createProject({
      userId: testUserId,
      name: "Test Project",
      description: "Test Description",
      ticker: "TEST",
      status: "draft",
    });
    testProjectId = project.id;
  });

  it("should create generation history record", async () => {
    const history = await db.createGenerationHistory({
      projectId: testProjectId,
      userId: testUserId,
      status: "generating",
      startTime: new Date(),
    });

    expect(history).toBeDefined();
    expect(history.id).toBeTypeOf("number");
    expect(history.projectId).toBe(testProjectId);
    expect(history.userId).toBe(testUserId);
    expect(history.status).toBe("generating");
  });

  it("should get generation history by project ID", async () => {
    const history = await db.getGenerationHistoryByProjectId(testProjectId);

    expect(history).toBeDefined();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].projectId).toBe(testProjectId);
  });

  it("should get generation history by user ID", async () => {
    const history = await db.getGenerationHistoryByUserId(testUserId, 10);

    expect(history).toBeDefined();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].userId).toBe(testUserId);
  });

  it("should update generation history record", async () => {
    // Create a new history record
    const history = await db.createGenerationHistory({
      projectId: testProjectId,
      userId: testUserId,
      status: "generating",
      startTime: new Date(),
    });

    // Update it to completed
    const endTime = new Date();
    const durationMs = 5000;
    await db.updateGenerationHistory(history.id, {
      status: "completed",
      endTime,
      durationMs,
      assetsGenerated: {
        logo: "https://example.com/logo.png",
        banner: "https://example.com/banner.png",
      },
    });

    // Verify the update
    const updated = await db.getGenerationHistoryById(history.id);
    expect(updated).toBeDefined();
    expect(updated?.status).toBe("completed");
    expect(updated?.durationMs).toBe(durationMs);
    expect(updated?.assetsGenerated).toBeDefined();
  });

  it("should record failed generation with error message", async () => {
    const history = await db.createGenerationHistory({
      projectId: testProjectId,
      userId: testUserId,
      status: "generating",
      startTime: new Date(),
    });

    await db.updateGenerationHistory(history.id, {
      status: "failed",
      endTime: new Date(),
      durationMs: 2000,
      errorMessage: "Test error message",
    });

    const updated = await db.getGenerationHistoryById(history.id);
    expect(updated?.status).toBe("failed");
    expect(updated?.errorMessage).toBe("Test error message");
  });
});
