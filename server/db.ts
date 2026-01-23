import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, projects, assets, orders, payments, subscriptions, InsertProject, InsertAsset, InsertOrder, InsertPayment, InsertSubscription } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Management ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Project Management ============

export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projects).values(project);
  // Get the last inserted project
  const inserted = await db.select().from(projects).where(eq(projects.userId, project.userId)).orderBy(desc(projects.createdAt)).limit(1);
  return inserted[0];
}

export async function getProjectsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
}

export async function getProjectById(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateProjectStatus(projectId: number, status: "draft" | "generating" | "completed" | "failed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set({ status, updatedAt: new Date() }).where(eq(projects.id, projectId));
}

export async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(projects).orderBy(desc(projects.createdAt));
}

// ============ Asset Management ============

export async function createAsset(asset: InsertAsset) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(assets).values(asset);
  return result;
}

export async function getAssetsByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(assets).where(eq(assets.projectId, projectId)).orderBy(desc(assets.createdAt));
}

export async function getAssetById(assetId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Order Management ============

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(orders).values(order);
  return result;
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateOrderStatus(orderId: number, status: "pending" | "processing" | "completed" | "cancelled" | "refunded") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, orderId));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(orders).orderBy(desc(orders.createdAt));
}

// ============ Payment Management ============

export async function createPayment(payment: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(payments).values(payment);
  return result;
}

export async function getPaymentsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(payments).where(eq(payments.orderId, orderId)).orderBy(desc(payments.createdAt));
}

export async function getPaymentById(paymentId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePaymentStatus(paymentId: number, status: "pending" | "succeeded" | "failed" | "refunded") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(payments).set({ status, updatedAt: new Date() }).where(eq(payments.id, paymentId));
}

// ============ Subscription Management ============

export async function upsertSubscription(subscription: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(subscriptions).values(subscription).onDuplicateKeyUpdate({
    set: {
      plan: subscription.plan,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      stripeCustomerId: subscription.stripeCustomerId,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      updatedAt: new Date(),
    },
  });
}

export async function getSubscriptionByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSubscriptionStatus(userId: number, status: "active" | "cancelled" | "expired" | "past_due") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(subscriptions).set({ status, updatedAt: new Date() }).where(eq(subscriptions.userId, userId));
}
