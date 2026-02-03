import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  walletAddress: varchar("walletAddress", { length: 100 }).unique(), // For wallet-based login (SIWE)
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }), // 'oauth' | 'wallet'
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  freeGenerationsUsed: int("freeGenerationsUsed").default(0).notNull(),
  totalPaidProjects: int("totalPaidProjects").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Meme projects created by users through Launch Engine
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ticker: varchar("ticker", { length: 50 }),
  website: varchar("website", { length: 500 }),
  tokenomics: text("tokenomics"),
  contractAddress: varchar("contractAddress", { length: 100 }),
  // Social links
  twitterUrl: varchar("twitterUrl", { length: 500 }),
  telegramUrl: varchar("telegramUrl", { length: 500 }),
  discordUrl: varchar("discordUrl", { length: 500 }),
  status: mysqlEnum("status", ["draft", "generating", "completed", "failed", "superseded"]).default("draft").notNull(),
  styleTemplate: varchar("styleTemplate", { length: 100 }),
  userImageUrl: varchar("userImageUrl", { length: 1000 }),
  userImageKey: varchar("userImageKey", { length: 500 }),
  userImages: json("userImages").$type<Array<{ url: string; key: string }>>(),
  subdomain: varchar("subdomain", { length: 100 }),
  deploymentUrl: varchar("deploymentUrl", { length: 1000 }),
  assetsBaseUrl: varchar("assetsBaseUrl", { length: 500 }), // e.g., https://assets.ezcto.fun/{slug}
  deploymentStatus: mysqlEnum("deploymentStatus", ["not_deployed", "deploying", "deployed", "failed"]).default("not_deployed"),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "pending", "paid"]).default("unpaid").notNull(),
  paymentAmount: varchar("paymentAmount", { length: 100 }),
  paymentCurrency: varchar("paymentCurrency", { length: 20 }),
  paymentTxHash: varchar("paymentTxHash", { length: 200 }),
  paymentWalletAddress: varchar("paymentWalletAddress", { length: 200 }),
  paidAt: timestamp("paidAt"),
  aiAnalysis: json("aiAnalysis").$type<{
    narrativeType?: string;
    layoutStyle?: string;
    colorPalette?: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
      accent: string;
    };
    vibe?: string;
    targetAudience?: string;
  }>(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  generationProgress: json("generationProgress").$type<{
    completedModules?: Array<'analysis' | 'images' | 'website_code'>;
    failedModule?: 'analysis' | 'images' | 'website_code' | null;
    retryCount?: number;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Generated brand assets (Logo, Banner, PFP, Poster, Copy, etc.)
 */
export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  assetType: mysqlEnum("assetType", [
    "logo",
    "banner",
    "paydex_banner",
    "x_banner",
    "hero_background",
    "feature_icon",
    "community_scene",
    "pfp",
    "poster",
    "narrative",
    "whitepaper",
    "tweet",
    "website"
  ]).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }),
  fileKey: varchar("fileKey", { length: 500 }),
  textContent: text("textContent"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;

/**
 * Merchandise orders (周边商品订单)
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  orderType: mysqlEnum("orderType", ["launch_standard", "launch_pro", "merch_design", "merch_production"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "cancelled", "refunded"]).default("pending").notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  orderDetails: json("orderDetails").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Payment records linked to orders
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  userId: int("userId").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(),
  paymentProvider: varchar("paymentProvider", { length: 50 }).default("stripe").notNull(),
  transactionId: varchar("transactionId", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "refunded"]).default("pending").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Subscription plans for PRO features
 */
export const generationHistory = mysqlTable("generation_history", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "generating", "completed", "failed"]).default("pending").notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime"),
  durationMs: int("durationMs"), // Duration in milliseconds
  assetsGenerated: json("assetsGenerated").$type<{
    logo?: string;
    banner?: string;
    pfp?: string;
    poster?: string;
    narrative?: boolean;
    whitepaper?: boolean;
    tweets?: boolean;
    website?: boolean;
  }>(),
  errorMessage: text("errorMessage"),
  metadata: json("metadata").$type<{
    currentStep?: string; // 'analysis' | 'images' | 'website' | 'deployment'
    steps?: Array<{
      step: string;
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      startTime?: string;
      endTime?: string;
      data?: any;
      error?: string;
    }>;
    progress?: {
      current: number;
      total: number;
      message: string;
    };
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InsertGenerationHistory = typeof generationHistory.$inferInsert;
export type SelectGenerationHistory = typeof generationHistory.$inferSelect;

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  plan: mysqlEnum("plan", ["free", "standard", "pro"]).default("free").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  status: mysqlEnum("status", ["active", "cancelled", "expired", "past_due"]).default("active").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InsertSubscription = typeof subscriptions.$inferInsert;
export type SelectSubscription = typeof subscriptions.$inferSelect;

/**
 * Custom manufacturing orders from Supply Chain page
 */
export const customOrders = mysqlTable("customOrders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productType: mysqlEnum("productType", ["merchandise", "packaging", "manufacturing", "logistics"]).notNull(),
  quantity: int("quantity").notNull(),
  budget: mysqlEnum("budget", ["small", "medium", "large", "enterprise"]).notNull(),
  description: text("description").notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 50 }),
  fileUrls: json("fileUrls").$type<Array<{ url: string; key: string; name: string }>>(),
  status: mysqlEnum("status", ["pending", "reviewing", "quoted", "in_production", "completed", "cancelled"]).default("pending").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomOrder = typeof customOrders.$inferSelect;
export type InsertCustomOrder = typeof customOrders.$inferInsert;

/**
 * Crypto payment records for deployment unlocking
 */
export const cryptoPayments = mysqlTable("cryptoPayments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  // Blockchain details
  chain: varchar("chain", { length: 50 }).notNull(), // 'BSC', 'ETH', etc.
  tokenSymbol: varchar("tokenSymbol", { length: 20 }).notNull(), // 'BNB', 'ETH', 'USDT', etc.
  tokenAddress: varchar("tokenAddress", { length: 100 }), // null for native tokens, contract address for ERC20/BEP20
  // Payment details
  senderAddress: varchar("senderAddress", { length: 100 }).notNull(),
  receiverAddress: varchar("receiverAddress", { length: 100 }).notNull(),
  amount: varchar("amount", { length: 100 }).notNull(), // Store as string to preserve precision
  amountUsd: decimal("amountUsd", { precision: 10, scale: 2 }), // USD equivalent at payment time
  // Transaction tracking
  txHash: varchar("txHash", { length: 100 }).unique(),
  blockNumber: int("blockNumber"),
  confirmations: int("confirmations").default(0).notNull(),
  // Status
  status: mysqlEnum("status", ["pending", "confirming", "confirmed", "failed", "expired"]).default("pending").notNull(),
  // Metadata
  metadata: json("metadata").$type<{
    gasUsed?: string;
    gasPrice?: string;
    blockTimestamp?: number;
    explorerUrl?: string;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  confirmedAt: timestamp("confirmedAt"),
});

export type CryptoPayment = typeof cryptoPayments.$inferSelect;
export type InsertCryptoPayment = typeof cryptoPayments.$inferInsert;

/**
 * Whitelist for free generations
 * Allows admin to grant specific wallet addresses free generation credits
 */
export const whitelist = mysqlTable("whitelist", {
  id: int("id").autoincrement().primaryKey(),
  walletAddress: varchar("walletAddress", { length: 100 }).notNull().unique(),
  freeGenerations: int("freeGenerations").default(1).notNull(),
  usedGenerations: int("usedGenerations").default(0).notNull(),
  note: text("note"), // Admin note for this whitelist entry
  isActive: boolean("isActive").default(true).notNull(),
  addedBy: int("addedBy"), // Admin user ID who added this entry
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Whitelist = typeof whitelist.$inferSelect;
export type InsertWhitelist = typeof whitelist.$inferInsert;


/**
 * Site-wide settings for admin configuration
 * Stores global settings like free period countdown
 */
export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: json("settingValue").$type<Record<string, unknown>>().notNull(),
  updatedBy: int("updatedBy"), // Admin user ID who last updated
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

// Type for free period setting value
export type FreePeriodSetting = {
  enabled: boolean;
  endTime: number; // UTC timestamp in milliseconds
  title: string;
  subtitle?: string;
};
