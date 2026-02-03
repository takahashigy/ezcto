import { eq, desc, and, lt, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, projects, assets, orders, payments, subscriptions, generationHistory, customOrders, whitelist, siteSettings, InsertProject, InsertAsset, InsertOrder, InsertPayment, InsertSubscription, InsertGenerationHistory, InsertCustomOrder, InsertWhitelist, FreePeriodSetting } from "../drizzle/schema";
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

export async function getUserByWalletAddress(walletAddress: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.walletAddress, walletAddress.toLowerCase())).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserByWallet(walletAddress: string, name?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalizedAddress = walletAddress.toLowerCase();
  // Generate a unique openId based on wallet address
  const openId = `wallet_${normalizedAddress}`;
  
  const values: InsertUser = {
    openId,
    walletAddress: normalizedAddress,
    name: name || `User ${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`,
    loginMethod: 'wallet',
    lastSignedIn: new Date(),
  };

  await db.insert(users).values(values);
  return await getUserByWalletAddress(normalizedAddress);
}

export async function updateUserWalletAddress(userId: number, walletAddress: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users)
    .set({ walletAddress: walletAddress.toLowerCase() })
    .where(eq(users.id, userId));
}

export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, userId));
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

export async function getProjectBySubdomain(subdomain: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(projects).where(eq(projects.subdomain, subdomain)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserPaidProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.paymentStatus, 'paid')))
    .orderBy(desc(projects.paidAt));
}

export async function getUserGeneratingProject(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.status, 'generating')))
    .orderBy(desc(projects.createdAt))
    .limit(1);
  
  if (result.length === 0) return undefined;
  
  const project = result[0];
  
  // Check if the generating project has timed out (15 minutes)
  const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
  const projectAge = Date.now() - new Date(project.updatedAt).getTime();
  
  if (projectAge > TIMEOUT_MS) {
    // Auto-mark as failed due to timeout
    console.log(`[DB] Project ${project.id} has been generating for ${Math.round(projectAge / 60000)} minutes, marking as failed`);
    await db.update(projects)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(projects.id, project.id));
    return undefined; // Return undefined so user can create new project
  }
  
  return project;
}

export async function updateProjectStatus(projectId: number, status: "draft" | "generating" | "completed" | "failed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set({ status, updatedAt: new Date() }).where(eq(projects.id, projectId));
}

/**
 * Clean up stale generating projects that have timed out
 * This function marks projects that have been in 'generating' status for more than 15 minutes as 'failed'
 * @returns Number of projects cleaned up
 */
export async function cleanupStaleGeneratingProjects(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
  const cutoffTime = new Date(Date.now() - TIMEOUT_MS);

  // Find all stale generating projects
  const staleProjects = await db.select().from(projects)
    .where(and(
      eq(projects.status, 'generating'),
      lt(projects.updatedAt, cutoffTime)
    ));

  if (staleProjects.length === 0) {
    return 0;
  }

  console.log(`[DB] Found ${staleProjects.length} stale generating projects to clean up`);

  // Mark them all as failed
  for (const project of staleProjects) {
    console.log(`[DB] Marking project ${project.id} (${project.name}) as failed due to timeout`);
    await db.update(projects)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(projects.id, project.id));
  }

  return staleProjects.length;
}

export async function updateProject(projectId: number, updates: Partial<Omit<InsertProject, 'id' | 'userId' | 'createdAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set({ ...updates, updatedAt: new Date() }).where(eq(projects.id, projectId));
}

export async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function getUnpaidProjectsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.paymentStatus, "unpaid")))
    .orderBy(desc(projects.createdAt));
}

/**
 * Get incomplete projects (paid but not completed) for a user
 * These are projects that can be superseded by a new submission
 */
export async function getIncompleteProjectsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(projects)
    .where(and(
      eq(projects.userId, userId),
      eq(projects.paymentStatus, "paid"),
      or(
        eq(projects.status, "draft"),
        eq(projects.status, "generating"),
        eq(projects.status, "failed")
      )
    ))
    .orderBy(desc(projects.createdAt));
}

/**
 * Mark a project as superseded (replaced by a new project)
 * Transfers payment info to the new project
 */
export async function supersedeProject(oldProjectId: number, newProjectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const oldProject = await getProjectById(oldProjectId);
  if (!oldProject) throw new Error("Old project not found");

  // Mark old project as superseded
  await db.update(projects)
    .set({ 
      status: "superseded",
      metadata: {
        ...(oldProject.metadata as Record<string, unknown> || {}),
        supersededBy: newProjectId,
        supersededAt: new Date().toISOString()
      }
    })
    .where(eq(projects.id, oldProjectId));

  // Transfer payment info to new project if old project was paid
  if (oldProject.paymentStatus === "paid") {
    await db.update(projects)
      .set({
        paymentStatus: "paid",
        paymentAmount: oldProject.paymentAmount,
        paymentCurrency: oldProject.paymentCurrency,
        paymentTxHash: oldProject.paymentTxHash,
        paymentWalletAddress: oldProject.paymentWalletAddress,
        paidAt: oldProject.paidAt,
        metadata: {
          supersededFrom: oldProjectId,
          originalPaymentAt: oldProject.paidAt?.toISOString()
        }
      })
      .where(eq(projects.id, newProjectId));
  }

  return { success: true };
}

export async function updateUserFreeGenerations(userId: number, increment: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");

  await db.update(users)
    .set({ freeGenerationsUsed: (user.freeGenerationsUsed || 0) + increment })
    .where(eq(users.id, userId));
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

export async function updateAssetFileUrl(
  projectId: number, 
  assetType: 'logo' | 'paydex_banner' | 'x_banner' | 'hero_background' | 'feature_icon' | 'community_scene',
  newFileUrl: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(assets)
    .set({ fileUrl: newFileUrl })
    .where(and(
      eq(assets.projectId, projectId),
      eq(assets.assetType, assetType)
    ));
}

// Update all asset fileUrls when slug changes (replace old slug with new slug)
export async function updateAssetsSlug(
  projectId: number,
  oldSlug: string,
  newSlug: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all assets for this project
  const projectAssets = await db.select().from(assets).where(eq(assets.projectId, projectId));
  
  // Update each asset's fileUrl by replacing old slug with new slug
  for (const asset of projectAssets) {
    if (asset.fileUrl && asset.fileUrl.includes(`/${oldSlug}/`)) {
      const newFileUrl = asset.fileUrl.replace(`/${oldSlug}/`, `/${newSlug}/`);
      await db.update(assets)
        .set({ fileUrl: newFileUrl })
        .where(eq(assets.id, asset.id));
    }
  }
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

// ============ Generation History Management ============

export async function createGenerationHistory(history: InsertGenerationHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(generationHistory).values(history);
  const inserted = await db.select().from(generationHistory)
    .where(eq(generationHistory.projectId, history.projectId))
    .orderBy(desc(generationHistory.createdAt))
    .limit(1);
  return inserted[0];
}

export async function getGenerationHistoryByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(generationHistory)
    .where(eq(generationHistory.projectId, projectId))
    .orderBy(desc(generationHistory.createdAt));
}

export async function getGenerationHistoryByUserId(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(generationHistory)
    .where(eq(generationHistory.userId, userId))
    .orderBy(desc(generationHistory.createdAt))
    .limit(limit);
}

export async function updateGenerationHistory(id: number, updates: Partial<InsertGenerationHistory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(generationHistory).set(updates).where(eq(generationHistory.id, id));
}

export async function getGenerationHistoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(generationHistory).where(eq(generationHistory.id, id));
  return result.length > 0 ? result[0] : undefined;
}

export async function getLatestGenerationHistoryByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(generationHistory)
    .where(eq(generationHistory.projectId, projectId))
    .orderBy(desc(generationHistory.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteGenerationHistory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(generationHistory).where(eq(generationHistory.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete related assets first
  await db.delete(assets).where(eq(assets.projectId, id));
  
  // Delete related generation history
  await db.delete(generationHistory).where(eq(generationHistory.projectId, id));
  
  // Delete the project
  await db.delete(projects).where(eq(projects.id, id));
}

// ============ Custom Orders Management ============

export async function createCustomOrder(order: InsertCustomOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(customOrders).values(order);
  const inserted = await db.select().from(customOrders)
    .where(eq(customOrders.userId, order.userId))
    .orderBy(desc(customOrders.createdAt))
    .limit(1);
  return inserted[0]?.id || 0;
}

export async function getCustomOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(customOrders)
    .where(eq(customOrders.userId, userId))
    .orderBy(desc(customOrders.createdAt));
}

export async function getCustomOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(customOrders).where(eq(customOrders.id, id));
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCustomOrderStatus(id: number, status: "pending" | "reviewing" | "quoted" | "in_production" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(customOrders).set({ status }).where(eq(customOrders.id, id));
}


// ============ Whitelist Management ============

export async function getWhitelistByAddress(walletAddress: string) {
  const db = await getDb();
  if (!db) return undefined;

  const normalizedAddress = walletAddress.toLowerCase();
  const result = await db.select().from(whitelist)
    .where(eq(whitelist.walletAddress, normalizedAddress));
  return result.length > 0 ? result[0] : undefined;
}

export async function checkWhitelistStatus(walletAddress: string) {
  const entry = await getWhitelistByAddress(walletAddress);
  if (!entry || !entry.isActive) {
    return { isWhitelisted: false, remainingGenerations: 0 };
  }
  const remaining = entry.freeGenerations - entry.usedGenerations;
  return {
    isWhitelisted: true,
    remainingGenerations: Math.max(0, remaining),
    freeGenerations: entry.freeGenerations,
    usedGenerations: entry.usedGenerations,
  };
}

export async function useWhitelistGeneration(walletAddress: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalizedAddress = walletAddress.toLowerCase();
  const entry = await getWhitelistByAddress(normalizedAddress);
  
  if (!entry || !entry.isActive) {
    return { success: false, error: "Not whitelisted" };
  }
  
  if (entry.usedGenerations >= entry.freeGenerations) {
    return { success: false, error: "No remaining free generations" };
  }

  await db.update(whitelist)
    .set({ usedGenerations: entry.usedGenerations + 1 })
    .where(eq(whitelist.walletAddress, normalizedAddress));

  return { 
    success: true, 
    remainingGenerations: entry.freeGenerations - entry.usedGenerations - 1 
  };
}

export async function addToWhitelist(entry: InsertWhitelist) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalizedAddress = entry.walletAddress.toLowerCase();
  
  // Check if already exists
  const existing = await getWhitelistByAddress(normalizedAddress);
  if (existing) {
    // Update existing entry
    await db.update(whitelist)
      .set({
        freeGenerations: entry.freeGenerations ?? existing.freeGenerations,
        note: entry.note ?? existing.note,
        isActive: entry.isActive ?? existing.isActive,
      })
      .where(eq(whitelist.walletAddress, normalizedAddress));
    return { success: true, updated: true };
  }

  await db.insert(whitelist).values({
    ...entry,
    walletAddress: normalizedAddress,
  });
  return { success: true, updated: false };
}

export async function bulkAddToWhitelist(entries: Array<{ walletAddress: string; freeGenerations?: number; note?: string }>, addedBy?: number) {
  const results = { added: 0, updated: 0, failed: 0 };
  
  for (const entry of entries) {
    try {
      const result = await addToWhitelist({
        walletAddress: entry.walletAddress,
        freeGenerations: entry.freeGenerations ?? 1,
        note: entry.note,
        addedBy,
      });
      if (result.updated) {
        results.updated++;
      } else {
        results.added++;
      }
    } catch (error) {
      results.failed++;
    }
  }
  
  return results;
}

export async function getAllWhitelist(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(whitelist)
    .orderBy(desc(whitelist.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updateWhitelistEntry(id: number, updates: Partial<InsertWhitelist>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (updates.walletAddress) {
    updates.walletAddress = updates.walletAddress.toLowerCase();
  }

  await db.update(whitelist).set(updates).where(eq(whitelist.id, id));
}

export async function deleteWhitelistEntry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(whitelist).where(eq(whitelist.id, id));
}

export async function getWhitelistCount() {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select().from(whitelist);
  return result.length;
}


// ============ Site Settings Management ============

export async function getSiteSetting<T = unknown>(key: string): Promise<T | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key)).limit(1);
  if (result.length === 0) return null;
  
  return result[0].settingValue as T;
}

export async function setSiteSetting<T = unknown>(key: string, value: T, updatedBy?: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key)).limit(1);
  
  if (existing.length > 0) {
    await db.update(siteSettings)
      .set({ settingValue: value as Record<string, unknown>, updatedBy })
      .where(eq(siteSettings.settingKey, key));
  } else {
    await db.insert(siteSettings).values({
      settingKey: key,
      settingValue: value as Record<string, unknown>,
      updatedBy,
    });
  }
}

// Free Period specific helpers
export const FREE_PERIOD_KEY = "free_period";

export async function getFreePeriodSetting(): Promise<FreePeriodSetting | null> {
  return await getSiteSetting<FreePeriodSetting>(FREE_PERIOD_KEY);
}

export async function setFreePeriodSetting(setting: FreePeriodSetting, updatedBy?: number): Promise<void> {
  await setSiteSetting(FREE_PERIOD_KEY, setting, updatedBy);
}

export async function isInFreePeriod(): Promise<boolean> {
  const setting = await getFreePeriodSetting();
  if (!setting || !setting.enabled) return false;
  
  return Date.now() < setting.endTime;
}
