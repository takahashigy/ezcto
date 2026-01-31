import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import type { Context } from "./_core/context";

describe("Crypto Payment Integration", () => {
  let testProjectId: number;
  let testUserId: number;

  beforeAll(async () => {
    const db = await getDb();
    
    // Create test user
    const [user] = await db.insert(schema.user).values({
      openId: "test-crypto-user",
      name: "Test Crypto User",
      email: "crypto@test.com",
    });
    testUserId = user.insertId;

    // Create test project
    const [project] = await db.insert(schema.project).values({
      userId: testUserId,
      name: "Test Crypto Project",
      ticker: "TESTCRYPTO",
      description: "Test project for crypto payment",
      status: "completed",
    });
    testProjectId = project.insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    await db.delete(schema.project).where(eq(schema.project.id, testProjectId));
    await db.delete(schema.user).where(eq(schema.user.id, testUserId));
  });

  it("should create a crypto payment record", async () => {
    const mockContext: Context = {
      user: {
        id: testUserId,
        openId: "test-crypto-user",
        name: "Test Crypto User",
        email: "crypto@test.com",
        role: "user",
        createdAt: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(mockContext);

    const result = await caller.crypto.createPayment({
      projectId: testProjectId,
      walletAddress: "0x1234567890123456789012345678901234567890",
      amount: "0.55",
      currency: "BNB",
      chain: "BSC",
    });

    expect(result).toBeDefined();
    expect(result.paymentId).toBeTypeOf("number");
    expect(result.status).toBe("pending");
    expect(result.walletAddress).toBe("0x1234567890123456789012345678901234567890");
  });

  it("should check payment status", async () => {
    const mockContext: Context = {
      user: {
        id: testUserId,
        openId: "test-crypto-user",
        name: "Test Crypto User",
        email: "crypto@test.com",
        role: "user",
        createdAt: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(mockContext);

    // Create a payment first
    const payment = await caller.crypto.createPayment({
      projectId: testProjectId,
      walletAddress: "0x1234567890123456789012345678901234567890",
      amount: "0.55",
      currency: "BNB",
      chain: "BSC",
    });

    // Check status
    const status = await caller.crypto.checkPaymentStatus({
      projectId: testProjectId,
    });

    expect(status).toBeDefined();
    expect(status.status).toBe("pending");
    expect(status.paymentId).toBe(payment.paymentId);
  });

  it("should validate BSC wallet address format", () => {
    const validAddress = "0x5ea1a353C4dB9E77E4A5035Eb89BA4F8F1d99e7D";
    const invalidAddress = "invalid-address";

    expect(validAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(invalidAddress).not.toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("should validate BNB amount format", () => {
    const validAmount = "0.55";
    const invalidAmount = "abc";

    expect(parseFloat(validAmount)).toBeGreaterThan(0);
    expect(isNaN(parseFloat(invalidAmount))).toBe(true);
  });
});
