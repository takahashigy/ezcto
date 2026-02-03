import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { ENV } from "../_core/env";
import {
  getAllWhitelist,
  addToWhitelist,
  bulkAddToWhitelist,
  updateWhitelistEntry,
  deleteWhitelistEntry,
  getWhitelistCount,
  checkWhitelistStatus,
} from "../db";

// Helper to check if user is admin (either by role or by being owner)
function isAdmin(user: { openId: string; role: string }) {
  return user.role === "admin" || user.openId === ENV.ownerOpenId;
}

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isAdmin(ctx.user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // Check if current user is admin
  isAdmin: protectedProcedure.query(({ ctx }) => {
    return { isAdmin: isAdmin(ctx.user) };
  }),

  // Get all whitelist entries
  getWhitelist: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(500).default(100),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const { limit = 100, offset = 0 } = input || {};
      const entries = await getAllWhitelist(limit, offset);
      const total = await getWhitelistCount();
      return { entries, total };
    }),

  // Add single address to whitelist
  addToWhitelist: adminProcedure
    .input(z.object({
      walletAddress: z.string().min(1),
      freeGenerations: z.number().min(1).default(1),
      note: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await addToWhitelist({
        walletAddress: input.walletAddress,
        freeGenerations: input.freeGenerations,
        note: input.note,
        addedBy: ctx.user.id,
      });
      return result;
    }),

  // Bulk import addresses to whitelist
  bulkImportWhitelist: adminProcedure
    .input(z.object({
      entries: z.array(z.object({
        walletAddress: z.string().min(1),
        freeGenerations: z.number().min(1).optional(),
        note: z.string().optional(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await bulkAddToWhitelist(input.entries, ctx.user.id);
      return result;
    }),

  // Parse CSV/text input for bulk import
  parseWhitelistInput: adminProcedure
    .input(z.object({
      text: z.string(),
    }))
    .mutation(({ input }) => {
      const lines = input.text.trim().split("\n");
      const entries: Array<{ walletAddress: string; freeGenerations: number }> = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        // Skip header row
        if (trimmed.toLowerCase().includes("address") || trimmed.toLowerCase().includes("wallet")) {
          continue;
        }
        
        // Parse CSV format: address,freeGenerations or just address
        const parts = trimmed.split(",").map(p => p.trim());
        const walletAddress = parts[0];
        const freeGenerations = parseInt(parts[1] || "1", 10) || 1;
        
        // Basic validation for wallet address format
        if (walletAddress && (walletAddress.startsWith("0x") || walletAddress.length >= 32)) {
          entries.push({ walletAddress, freeGenerations });
        }
      }
      
      return { entries, count: entries.length };
    }),

  // Update whitelist entry
  updateWhitelistEntry: adminProcedure
    .input(z.object({
      id: z.number(),
      freeGenerations: z.number().min(0).optional(),
      usedGenerations: z.number().min(0).optional(),
      note: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await updateWhitelistEntry(id, updates);
      return { success: true };
    }),

  // Delete whitelist entry
  deleteWhitelistEntry: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      await deleteWhitelistEntry(input.id);
      return { success: true };
    }),

  // Check whitelist status for a wallet (public, for Launch page)
  // Changed to publicProcedure so wallet-only users can check whitelist status without OAuth login
  checkWhitelistStatus: publicProcedure
    .input(z.object({
      walletAddress: z.string(),
    }))
    .query(async ({ input }) => {
      return await checkWhitelistStatus(input.walletAddress);
    }),
});
