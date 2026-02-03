import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { SiweMessage } from "siwe";
import { randomBytes } from "crypto";
import { SignJWT } from "jose";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import * as db from "../db";
import { ENV } from "../_core/env";

// Store nonces temporarily (in production, use Redis or similar)
const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

// Clean up expired nonces periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(nonceStore.entries());
  for (const [key, value] of entries) {
    if (value.expiresAt < now) {
      nonceStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export const walletRouter = router({
  /**
   * Get a nonce for SIWE signing
   */
  getNonce: publicProcedure
    .input(z.object({
      address: z.string(),
    }))
    .mutation(async ({ input }) => {
      const nonce = randomBytes(16).toString("hex");
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      
      nonceStore.set(input.address.toLowerCase(), { nonce, expiresAt });
      
      return { nonce };
    }),

  /**
   * Verify SIWE signature and create session
   */
  verify: publicProcedure
    .input(z.object({
      message: z.string(),
      signature: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Parse the SIWE message
        const siweMessage = new SiweMessage(input.message);
        
        // Verify the signature
        const fields = await siweMessage.verify({ signature: input.signature });
        
        if (!fields.success) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid signature",
          });
        }

        const address = siweMessage.address.toLowerCase();
        
        // Check nonce
        const storedNonce = nonceStore.get(address);
        if (!storedNonce || storedNonce.nonce !== siweMessage.nonce) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid or expired nonce",
          });
        }
        
        // Clear used nonce
        nonceStore.delete(address);

        // Find or create user
        let user = await db.getUserByWalletAddress(address);
        
        if (!user) {
          // Create new user with wallet address
          user = await db.createUserByWallet(address);
        } else {
          // Update last signed in
          await db.updateUserLastSignedIn(user.id);
        }

        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create or find user",
          });
        }

        // Create JWT token using jose (same as sdk.ts)
        const secretKey = new TextEncoder().encode(ENV.cookieSecret);
        const expiresInMs = 7 * 24 * 60 * 60 * 1000; // 7 days
        const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1000);
        
        const token = await new SignJWT({
          openId: user.openId,
          appId: ENV.appId,
          name: user.name || "",
        })
          .setProtectedHeader({ alg: "HS256", typ: "JWT" })
          .setExpirationTime(expirationSeconds)
          .sign(secretKey);

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            walletAddress: address,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Wallet Auth] Verification failed:", error);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Signature verification failed",
        });
      }
    }),

  /**
   * Check if a wallet address is already registered
   */
  checkAddress: publicProcedure
    .input(z.object({
      address: z.string(),
    }))
    .query(async ({ input }) => {
      const user = await db.getUserByWalletAddress(input.address);
      return {
        exists: !!user,
        isAdmin: user?.role === "admin",
      };
    }),
});
