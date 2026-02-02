import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { JsonRpcProvider } from "ethers";
import { CHAINS, TOKENS, PAYMENT_CONFIG, WEB3_CONFIG } from "../../shared/web3Config";
import {
  createCryptoPayment,
  getCryptoPaymentById,
  getCryptoPaymentByTxHash,
  updateCryptoPaymentStatus,
  projectHasValidPayment,
} from "../cryptoDb";
import { getProjectById, updateProject } from "../db";

// RPC Providers for different chains
const providers = {
  ETH: new JsonRpcProvider(CHAINS.ETH.rpcUrl),
  BSC: new JsonRpcProvider(CHAINS.BSC.rpcUrl),
  POLYGON: new JsonRpcProvider(CHAINS.POLYGON.rpcUrl),
};

export const cryptoRouter = router({
  /**
   * Create a new crypto payment record
   * Supports multiple chains: ETH, BSC, POLYGON
   */
  createPayment: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        chain: z.enum(["ETH", "BSC", "POLYGON", "SOLANA"]),
        tokenSymbol: z.string(),
        tokenAddress: z.string().nullable().optional(),
        amount: z.string(),
        senderAddress: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify project exists and belongs to user
      const project = await getProjectById(input.projectId);
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (project.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to access this project",
        });
      }

      // Check if project already has a confirmed payment
      const existingPayment = await projectHasValidPayment(input.projectId);
      if (existingPayment) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This project already has a confirmed payment",
        });
      }

      // Get receiver address based on chain type
      const receiverAddress = input.chain === 'SOLANA' 
        ? PAYMENT_CONFIG.receivers.SOLANA 
        : PAYMENT_CONFIG.receivers.EVM;

      // Create payment record
      const payment = await createCryptoPayment({
        projectId: input.projectId,
        userId: ctx.user.id,
        chain: input.chain,
        tokenSymbol: input.tokenSymbol,
        tokenAddress: input.tokenAddress || null,
        senderAddress: input.senderAddress.toLowerCase(),
        receiverAddress: receiverAddress.toLowerCase(),
        amount: input.amount,
        amountUsd: PAYMENT_CONFIG.priceUSD.toString(),
        status: "pending",
      });

      return payment;
    }),

  /**
   * Verify payment by transaction hash
   * Supports multiple EVM chains
   */
  verifyPayment: protectedProcedure
    .input(
      z.object({
        paymentId: z.number(),
        txHash: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get payment record
      const payment = await getCryptoPaymentById(input.paymentId);
      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      // Verify user owns this payment
      if (payment.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to access this payment",
        });
      }

      // Check if already verified
      if (payment.status === "confirmed") {
        return { success: true, payment };
      }

      // For Solana, we'd need a different verification approach
      if (payment.chain === 'SOLANA') {
        // Simplified Solana verification - in production, use @solana/web3.js
        await updateCryptoPaymentStatus(payment.id, "confirmed", {
          txHash: input.txHash,
          confirmedAt: new Date(),
          metadata: {
            explorerUrl: `https://solscan.io/tx/${input.txHash}`,
          },
        });

        // Update project deployment status
        try {
          await updateProject(payment.projectId, { deploymentStatus: 'deployed' });
        } catch (e) {
          console.error('Failed to update project deployment status:', e);
        }

        return { success: true, message: "Payment confirmed!" };
      }

      // Get the appropriate provider for EVM chains
      const chainKey = payment.chain as 'ETH' | 'BSC' | 'POLYGON';
      const provider = providers[chainKey];
      if (!provider) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unsupported chain: ${payment.chain}`,
        });
      }

      try {
        // Get transaction from blockchain
        const tx = await provider.getTransaction(input.txHash);
        if (!tx) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Transaction not found on blockchain",
          });
        }

        // For native token transfers, verify directly
        const isNativeToken = !payment.tokenAddress;
        
        if (isNativeToken) {
          // Verify native token transfer
          if (tx.to?.toLowerCase() !== payment.receiverAddress.toLowerCase()) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Transaction recipient doesn't match",
            });
          }

          if (tx.from.toLowerCase() !== payment.senderAddress.toLowerCase()) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Transaction sender doesn't match",
            });
          }

          // Verify amount (convert from wei)
          const amountInToken = Number(tx.value) / 1e18;
          const expectedAmount = parseFloat(payment.amount);
          const tolerance = expectedAmount * 0.01; // 1% tolerance
          if (Math.abs(amountInToken - expectedAmount) > tolerance) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Amount mismatch. Expected ${expectedAmount}, got ${amountInToken}`,
            });
          }
        } else {
          // For ERC20 tokens, verify the transaction is to the token contract
          if (tx.to?.toLowerCase() !== payment.tokenAddress?.toLowerCase()) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Transaction is not to the expected token contract",
            });
          }
        }

        // Get transaction receipt to check confirmations
        const receipt = await provider.getTransactionReceipt(input.txHash);
        if (!receipt) {
          // Transaction exists but not mined yet
          await updateCryptoPaymentStatus(payment.id, "confirming", {
            txHash: input.txHash,
          });
          return { success: false, message: "Transaction pending confirmation" };
        }

        // Check if transaction was successful
        if (receipt.status !== 1) {
          await updateCryptoPaymentStatus(payment.id, "failed", {
            txHash: input.txHash,
          });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Transaction failed on blockchain",
          });
        }

        // Get current block number to calculate confirmations
        const currentBlock = await provider.getBlockNumber();
        const confirmations = currentBlock - receipt.blockNumber + 1;
        const requiredConfirmations = PAYMENT_CONFIG.confirmations[chainKey] || 15;

        // Get explorer URL
        const explorerUrl = `${CHAINS[chainKey].blockExplorer}/tx/${input.txHash}`;

        // Update payment status
        if (confirmations >= requiredConfirmations) {
          await updateCryptoPaymentStatus(payment.id, "confirmed", {
            txHash: input.txHash,
            blockNumber: receipt.blockNumber,
            confirmations,
            confirmedAt: new Date(),
            metadata: {
              gasUsed: receipt.gasUsed.toString(),
              gasPrice: tx.gasPrice?.toString(),
              blockTimestamp: (await provider.getBlock(receipt.blockNumber))?.timestamp,
              explorerUrl,
            },
          });

          // Update project deployment status to deployed
          try {
            await updateProject(payment.projectId, { deploymentStatus: 'deployed' });
          } catch (e) {
            console.error('Failed to update project deployment status:', e);
          }

          return { success: true, message: "Payment confirmed!" };
        } else {
          await updateCryptoPaymentStatus(payment.id, "confirming", {
            txHash: input.txHash,
            blockNumber: receipt.blockNumber,
            confirmations,
          });

          return {
            success: false,
            message: `Waiting for confirmations (${confirmations}/${requiredConfirmations})`,
          };
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify payment",
        });
      }
    }),

  /**
   * Check if project has valid payment
   */
  checkPaymentStatus: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify project exists and belongs to user
      const project = await getProjectById(input.projectId);
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (project.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to access this project",
        });
      }

      const hasPayment = await projectHasValidPayment(input.projectId);
      return { hasPaid: hasPayment };
    }),

  /**
   * Get EZCTO token price from DEX
   */
  getEzctoPrice: publicProcedure.query(async () => {
    try {
      // Try to get price from DexScreener API
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${TOKENS.BSC.EZCTO.address}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch price');
      }
      
      const data = await response.json();
      
      // Get the first pair with USD price
      const pair = data.pairs?.find((p: any) => p.priceUsd && parseFloat(p.priceUsd) > 0);
      
      if (pair) {
        const priceUsd = parseFloat(pair.priceUsd);
        const ezctoNeeded = PAYMENT_CONFIG.ezctoPaymentUSD / priceUsd;
        
        return {
          priceUsd,
          ezctoPaymentUSD: PAYMENT_CONFIG.ezctoPaymentUSD,
          ezctoNeeded: Math.ceil(ezctoNeeded * 100) / 100, // Round up to 2 decimals
          pairAddress: pair.pairAddress,
          liquidity: pair.liquidity?.usd,
          lastUpdated: new Date().toISOString(),
        };
      }
      
      // Fallback: return a default price if no DEX data
      return {
        priceUsd: 0,
        ezctoPaymentUSD: PAYMENT_CONFIG.ezctoPaymentUSD,
        ezctoNeeded: 0,
        pairAddress: null,
        liquidity: null,
        lastUpdated: new Date().toISOString(),
        error: 'No DEX pair found',
      };
    } catch (error) {
      console.error('Failed to fetch EZCTO price:', error);
      return {
        priceUsd: 0,
        ezctoPaymentUSD: PAYMENT_CONFIG.ezctoPaymentUSD,
        ezctoNeeded: 0,
        pairAddress: null,
        liquidity: null,
        lastUpdated: new Date().toISOString(),
        error: 'Failed to fetch price',
      };
    }
  }),

  /**
   * Get payment configuration
   */
  getConfig: publicProcedure.query(() => {
    return {
      priceUSD: PAYMENT_CONFIG.priceUSD,
      ezctoPaymentUSD: PAYMENT_CONFIG.ezctoPaymentUSD,
      receivers: PAYMENT_CONFIG.receivers,
      supportedChains: ['ETH', 'BSC', 'POLYGON', 'SOLANA'],
      tokens: {
        ETH: Object.keys(TOKENS.ETH),
        BSC: Object.keys(TOKENS.BSC),
        POLYGON: Object.keys(TOKENS.POLYGON),
        SOLANA: Object.keys(TOKENS.SOLANA),
      },
      ezctoToken: {
        address: TOKENS.BSC.EZCTO.address,
        symbol: TOKENS.BSC.EZCTO.symbol,
        decimals: TOKENS.BSC.EZCTO.decimals,
        chain: 'BSC',
      },
    };
  }),
});
