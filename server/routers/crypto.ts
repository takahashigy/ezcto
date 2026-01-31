import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { JsonRpcProvider } from "ethers";
import { WEB3_CONFIG } from "../../shared/web3Config";
import {
  createCryptoPayment,
  getCryptoPaymentById,
  getCryptoPaymentByTxHash,
  updateCryptoPaymentStatus,
  projectHasValidPayment,
} from "../cryptoDb";
import { getProjectById } from "../db";

// BSC RPC Provider
const bscProvider = new JsonRpcProvider(WEB3_CONFIG.BSC.rpcUrls[0]);

export const cryptoRouter = router({
  /**
   * Create a new crypto payment record
   */
  createPayment: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        chain: z.literal("BSC"),
        tokenSymbol: z.string(),
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

      // Create payment record
      const payment = await createCryptoPayment({
        projectId: input.projectId,
        userId: ctx.user.id,
        chain: input.chain,
        tokenSymbol: input.tokenSymbol,
        tokenAddress: null, // BNB is native token
        senderAddress: input.senderAddress.toLowerCase(),
        receiverAddress: WEB3_CONFIG.PAYMENT.receiverAddress.toLowerCase(),
        amount: input.amount,
        amountUsd: WEB3_CONFIG.PAYMENT.priceInUSD.toString(),
        status: "pending",
      });

      return payment;
    }),

  /**
   * Verify payment by transaction hash
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

      try {
        // Get transaction from blockchain
        const tx = await bscProvider.getTransaction(input.txHash);
        if (!tx) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Transaction not found on blockchain",
          });
        }

        // Verify transaction details
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

        // Verify amount (convert from wei to BNB)
        const amountInBNB = Number(tx.value) / 1e18;
        const expectedAmount = parseFloat(payment.amount);
        if (Math.abs(amountInBNB - expectedAmount) > 0.001) {
          // Allow 0.001 BNB tolerance
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Amount mismatch. Expected ${expectedAmount} BNB, got ${amountInBNB} BNB`,
          });
        }

        // Get transaction receipt to check confirmations
        const receipt = await bscProvider.getTransactionReceipt(input.txHash);
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
        const currentBlock = await bscProvider.getBlockNumber();
        const confirmations = currentBlock - receipt.blockNumber + 1;

        // Update payment status
        if (confirmations >= WEB3_CONFIG.PAYMENT.requiredConfirmations) {
          await updateCryptoPaymentStatus(payment.id, "confirmed", {
            txHash: input.txHash,
            blockNumber: receipt.blockNumber,
            confirmations,
            confirmedAt: new Date(),
            metadata: {
              gasUsed: receipt.gasUsed.toString(),
              gasPrice: tx.gasPrice?.toString(),
              blockTimestamp: (await bscProvider.getBlock(receipt.blockNumber))?.timestamp,
              explorerUrl: `https://bscscan.com/tx/${input.txHash}`,
            },
          });

          return { success: true, message: "Payment confirmed!" };
        } else {
          await updateCryptoPaymentStatus(payment.id, "confirming", {
            txHash: input.txHash,
            blockNumber: receipt.blockNumber,
            confirmations,
          });

          return {
            success: false,
            message: `Waiting for confirmations (${confirmations}/${WEB3_CONFIG.PAYMENT.requiredConfirmations})`,
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
});
