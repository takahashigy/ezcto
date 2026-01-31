import { getDb } from "./db";
import { cryptoPayments, type InsertCryptoPayment, type CryptoPayment } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Create a new crypto payment record
 */
export async function createCryptoPayment(data: InsertCryptoPayment): Promise<CryptoPayment> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(cryptoPayments).values(data);
  const insertId = Number(result[0].insertId);
  const payment = await getCryptoPaymentById(insertId);
  if (!payment) throw new Error('Failed to create payment');
  return payment;
}

/**
 * Get crypto payment by ID
 */
export async function getCryptoPaymentById(id: number): Promise<CryptoPayment | null> {
  const db = await getDb();
  if (!db) return null;
  const [payment] = await db.select().from(cryptoPayments).where(eq(cryptoPayments.id, id));
  return payment || null;
}

/**
 * Get crypto payment by transaction hash
 */
export async function getCryptoPaymentByTxHash(txHash: string): Promise<CryptoPayment | null> {
  const db = await getDb();
  if (!db) return null;
  const [payment] = await db.select().from(cryptoPayments).where(eq(cryptoPayments.txHash, txHash));
  return payment || null;
}

/**
 * Get all crypto payments for a project
 */
export async function getCryptoPaymentsByProject(projectId: number): Promise<CryptoPayment[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(cryptoPayments)
    .where(eq(cryptoPayments.projectId, projectId))
    .orderBy(desc(cryptoPayments.createdAt));
}

/**
 * Get confirmed crypto payment for a project
 */
export async function getConfirmedPaymentForProject(projectId: number): Promise<CryptoPayment | null> {
  const db = await getDb();
  if (!db) return null;
  const [payment] = await db
    .select()
    .from(cryptoPayments)
    .where(
      and(
        eq(cryptoPayments.projectId, projectId),
        eq(cryptoPayments.status, "confirmed")
      )
    )
    .orderBy(desc(cryptoPayments.createdAt))
    .limit(1);
  return payment || null;
}

/**
 * Update crypto payment status
 */
export async function updateCryptoPaymentStatus(
  id: number,
  status: CryptoPayment["status"],
  updates?: Partial<Pick<CryptoPayment, "txHash" | "blockNumber" | "confirmations" | "confirmedAt" | "metadata">>
): Promise<CryptoPayment> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db
    .update(cryptoPayments)
    .set({
      status,
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(cryptoPayments.id, id));
  const payment = await getCryptoPaymentById(id);
  if (!payment) throw new Error('Failed to update payment');
  return payment;
}

/**
 * Check if project has valid payment
 */
export async function projectHasValidPayment(projectId: number): Promise<boolean> {
  const payment = await getConfirmedPaymentForProject(projectId);
  return payment !== null;
}
