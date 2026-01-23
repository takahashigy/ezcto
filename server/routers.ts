import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { executeLaunch } from "./launch";
import { createCheckoutSession, createSubscriptionCheckoutSession } from "./stripe";
import { ALL_PRODUCTS } from "./products";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Project Management
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getProjectsByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const project = await db.getProjectById(input.id);
        if (!project) {
          throw new Error("Project not found");
        }
        // Verify ownership
        if (project.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error("Unauthorized");
        }
        return project;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        ticker: z.string().max(50).optional(),
        styleTemplate: z.string().max(100).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const project = await db.createProject({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          ticker: input.ticker,
          styleTemplate: input.styleTemplate,
          status: "draft",
        });
        const projectId = project.id;
        
        // Trigger launch automation in background
        if (projectId) {
          executeLaunch({
            projectId,
            name: input.name,
            description: input.description,
            ticker: input.ticker,
            styleTemplate: input.styleTemplate,
          }).catch(error => {
            console.error("[Launch] Background execution failed:", error);
          });
        }
        
        return { success: true, projectId };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "generating", "completed", "failed"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const project = await db.getProjectById(input.id);
        if (!project) {
          throw new Error("Project not found");
        }
        if (project.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error("Unauthorized");
        }
        await db.updateProjectStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // Asset Management
  assets: router({
    downloadProjectZip: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }
        if (project.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error("Unauthorized");
        }

        const assets = await db.getAssetsByProjectId(input.projectId);
        
        // 返回所有资产的URL列表，前端负责打包
        return {
          projectName: project.name,
          assets: assets.map(asset => ({
            type: asset.assetType,
            url: asset.fileUrl,
            textContent: asset.textContent,
          })),
        };
      }),
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input, ctx }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }
        if (project.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error("Unauthorized");
        }
        return await db.getAssetsByProjectId(input.projectId);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        assetType: z.enum(["logo", "banner", "pfp", "poster", "narrative", "whitepaper", "tweet", "website"]),
        fileUrl: z.string().optional(),
        fileKey: z.string().optional(),
        textContent: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }
        if (project.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error("Unauthorized");
        }
        await db.createAsset(input);
        return { success: true };
      }),
  }),

  // Order Management
  orders: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getOrdersByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const order = await db.getOrderById(input.id);
        if (!order) {
          throw new Error("Order not found");
        }
        if (order.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error("Unauthorized");
        }
        return order;
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number().optional(),
        orderType: z.enum(["launch_standard", "launch_pro", "merch_design", "merch_production"]),
        totalAmount: z.string(),
        currency: z.string().default("USD"),
        orderDetails: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.createOrder({
          userId: ctx.user.id,
          projectId: input.projectId,
          orderType: input.orderType,
          totalAmount: input.totalAmount,
          currency: input.currency,
          orderDetails: input.orderDetails,
          status: "pending",
        });
        return { success: true };
      }),
  }),

  // Subscription Management
  subscription: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSubscriptionByUserId(ctx.user.id);
    }),

    upsert: protectedProcedure
      .input(z.object({
        plan: z.enum(["free", "standard", "pro"]),
        stripeSubscriptionId: z.string().optional(),
        stripeCustomerId: z.string().optional(),
        status: z.enum(["active", "cancelled", "expired", "past_due"]).default("active"),
        currentPeriodStart: z.date().optional(),
        currentPeriodEnd: z.date().optional(),
        cancelAtPeriodEnd: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.upsertSubscription({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
  }),

  // Launch Automation Engine
  launch: router({
    trigger: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }
        if (project.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error("Unauthorized");
        }

        // Execute launch in background (non-blocking)
        executeLaunch({
          projectId: project.id,
          name: project.name,
          description: project.description || undefined,
          ticker: project.ticker || undefined,
          styleTemplate: project.styleTemplate || undefined,
        }).catch(error => {
          console.error("[Launch] Background execution failed:", error);
        });

        return { success: true, message: "Launch process started" };
      }),
  }),

  // Payment & Subscription
  payment: router({
    getProducts: publicProcedure.query(() => {
      return ALL_PRODUCTS;
    }),

    createCheckout: protectedProcedure
      .input(z.object({
        priceId: z.string(),
        projectId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const origin = ctx.req.headers.origin || 'http://localhost:3000';
        
        const session = await createCheckoutSession({
          userId: ctx.user.id,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || undefined,
          priceId: input.priceId,
          projectId: input.projectId,
          successUrl: `${origin}/dashboard?payment=success`,
          cancelUrl: `${origin}/dashboard?payment=cancelled`,
        });

        return { checkoutUrl: session.url };
      }),

    createSubscriptionCheckout: protectedProcedure
      .input(z.object({
        priceId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const origin = ctx.req.headers.origin || 'http://localhost:3000';
        
        const session = await createSubscriptionCheckoutSession({
          userId: ctx.user.id,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || undefined,
          priceId: input.priceId,
          successUrl: `${origin}/dashboard?subscription=success`,
          cancelUrl: `${origin}/dashboard?subscription=cancelled`,
        });

        return { checkoutUrl: session.url };
      }),

    createDeploymentCheckout: protectedProcedure
      .input(z.object({
        projectId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }
        if (project.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error("Unauthorized");
        }

        const origin = ctx.req.headers.origin || 'http://localhost:3000';
        
        // 使用固定价格：$29 USD
        const deploymentProduct = ALL_PRODUCTS.find(p => p.id === 'deployment');
        if (!deploymentProduct) {
          throw new Error("Deployment product not configured");
        }

        const session = await createCheckoutSession({
          userId: ctx.user.id,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || undefined,
          priceId: deploymentProduct.priceId,
          projectId: input.projectId,
          successUrl: `${origin}/dashboard?deployment=success&projectId=${input.projectId}`,
          cancelUrl: `${origin}/dashboard?deployment=cancelled`,
        });

        return { url: session.url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
