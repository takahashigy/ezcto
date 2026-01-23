import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(user?: Partial<AuthenticatedUser>): TrpcContext {
  const defaultUser: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...user,
  };

  return {
    user: defaultUser,
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("projects router", () => {
  it("should create a project successfully", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.create({
      name: "Test Meme Project",
      description: "A test project for unit testing",
      ticker: "TEST",
      styleTemplate: "pixel_punk",
    });

    expect(result.success).toBe(true);
    expect(result.projectId).toBeTypeOf("number");
  });

  it("should list user projects", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const projects = await caller.projects.list();

    expect(Array.isArray(projects)).toBe(true);
  });

  it("should get project by ID", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project first
    const createResult = await caller.projects.create({
      name: "Test Project for Get",
      description: "Testing get by ID",
    });

    const project = await caller.projects.getById({ id: createResult.projectId });

    expect(project).toBeDefined();
    expect(project?.name).toBe("Test Project for Get");
  });

  it("should reject unauthorized access to other user's project", async () => {
    const user1Ctx = createTestContext({ id: 1 });
    const user2Ctx = createTestContext({ id: 2 });
    
    const caller1 = appRouter.createCaller(user1Ctx);
    const caller2 = appRouter.createCaller(user2Ctx);

    // User 1 creates a project
    const createResult = await caller1.projects.create({
      name: "User 1 Project",
    });

    // User 2 tries to access User 1's project
    const project = await caller2.projects.getById({ id: createResult.projectId });

    // Should return null or undefined for unauthorized access
    expect(project).toBeNull();
  });

  it("should allow admin to access any project", async () => {
    const userCtx = createTestContext({ id: 1, role: "user" });
    const adminCtx = createTestContext({ id: 2, role: "admin" });
    
    const userCaller = appRouter.createCaller(userCtx);
    const adminCaller = appRouter.createCaller(adminCtx);

    // User creates a project
    const createResult = await userCaller.projects.create({
      name: "User Project",
    });

    // Admin accesses the project
    const project = await adminCaller.projects.getById({ id: createResult.projectId });

    expect(project).toBeDefined();
    expect(project?.name).toBe("User Project");
  });
});

describe("payment router", () => {
  it("should get all products", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.payment.getProducts();

    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
    expect(products[0]).toHaveProperty("id");
    expect(products[0]).toHaveProperty("name");
    expect(products[0]).toHaveProperty("priceId");
  });

  it("should create checkout session", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.payment.createCheckout({
      priceId: "price_test_123",
    });

    expect(result).toHaveProperty("checkoutUrl");
    expect(result.checkoutUrl).toBeTypeOf("string");
  });

  it("should create subscription checkout session", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.payment.createSubscriptionCheckout({
      priceId: "price_test_subscription",
    });

    expect(result).toHaveProperty("checkoutUrl");
    expect(result.checkoutUrl).toBeTypeOf("string");
  });
});
