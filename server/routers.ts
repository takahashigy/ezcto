import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { executeLaunch } from "./launch";
import { analyzeProject } from "./aiAnalyzer";
import { generateProjectAssets } from "./assetGenerator";
import { generateWebsiteHTML } from "./websiteTemplate";
import { createCheckoutSession, createSubscriptionCheckoutSession } from "./stripe";
import { ALL_PRODUCTS } from "./products";
import { storagePut } from "./storage";
import { removeBackground } from "./_core/backgroundRemoval";
import { notifyOwner } from "./_core/notification";
import { uploadToR2 } from "./cloudflareR2";

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

  // Image Upload
  upload: router({
    characterImage: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileType: z.string(),
        base64Data: z.string(),
        removeBackground: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Convert base64 to buffer
          const base64WithoutPrefix = input.base64Data.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64WithoutPrefix, "base64");
          
          // Generate unique file key
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(7);
          const fileExtension = input.fileName.split(".").pop() || "png";
          const fileKey = `user-uploads/${ctx.user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;
          
          // Upload to S3
          let finalUrl = "";
          let finalFileKey = fileKey;
          
          // Remove background if requested
          if (input.removeBackground) {
            const { url: uploadedUrl } = await storagePut(fileKey, buffer, input.fileType);
            const { url: noBgUrl, fileKey: noBgKey } = await removeBackground({
              imageUrl: uploadedUrl,
              size: "auto",
              type: "auto",
            });
            finalUrl = noBgUrl;
            finalFileKey = noBgKey;
          } else {
            const { url } = await storagePut(fileKey, buffer, input.fileType);
            finalUrl = url;
          }
          
          return {
            success: true,
            url: finalUrl,
            fileKey: finalFileKey,
          };
        } catch (error) {
          console.error("[Upload] Failed to upload image:", error);
          throw new Error("Failed to upload image");
        }
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
        userImageUrl: z.string().optional(),
        userImageKey: z.string().optional(),
        userImages: z.string().optional(), // JSON string of array
      }))
      .mutation(async ({ input, ctx }) => {
        const project = await db.createProject({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          ticker: input.ticker,
          styleTemplate: input.styleTemplate,
          userImageUrl: input.userImageUrl,
          userImageKey: input.userImageKey,
          userImages: input.userImages ? JSON.parse(input.userImages) : null,
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
            userImageUrl: input.userImageUrl,
            userImages: input.userImages ? JSON.parse(input.userImages) : undefined,
          }).catch(error => {
            console.error("[Launch] Background execution failed:", error);
          });
        }
        
        return { success: true, projectId };
      }),

    getHistory: protectedProcedure
      .input(z.object({
        projectId: z.number().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        if (input.projectId) {
          // Get history for specific project
          const project = await db.getProjectById(input.projectId);
          if (!project) {
            throw new Error("Project not found");
          }
          if (project.userId !== ctx.user.id && ctx.user.role !== 'admin') {
            throw new Error("Unauthorized");
          }
          return await db.getGenerationHistoryByProjectId(input.projectId);
        } else {
          // Get all history for current user
          return await db.getGenerationHistoryByUserId(ctx.user.id, input.limit || 20);
        }
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

    // AI analysis preview (no asset generation)
    previewAnalysis: protectedProcedure
      .input(z.object({
        projectName: z.string().min(1).max(255),
        ticker: z.string().min(1).max(50),
        description: z.string().min(10).max(2000),
        memeImageUrl: z.string().url(),
      }))
      .mutation(async ({ input }) => {
        console.log(`[PreviewAnalysis] Analyzing ${input.projectName}`);

        try {
          // Run AI analysis only (no asset generation)
          const analysis = await analyzeProject(
            input.memeImageUrl,
            input.projectName,
            input.ticker,
            input.description
          );

          console.log(`[PreviewAnalysis] Analysis complete:`, analysis);

          return {
            success: true,
            analysis,
          };
        } catch (error) {
          console.error(`[PreviewAnalysis] Analysis failed:`, error);
          throw error;
        }
      }),

    // Generate preview HTML with custom settings
    generatePreview: protectedProcedure
      .input(z.object({
        projectName: z.string().min(1).max(255),
        ticker: z.string().min(1).max(50),
        description: z.string().min(10).max(2000),
        memeImageUrl: z.string().url(),
        analysis: z.object({
          narrativeType: z.enum(["community", "tech", "culture", "gaming"]),
          layoutStyle: z.enum(["minimal", "playful", "cyberpunk", "retro"]),
          colorPalette: z.object({
            primary: z.string(),
            secondary: z.string(),
            background: z.string(),
            text: z.string(),
            accent: z.string(),
          }),
          vibe: z.enum(["friendly", "edgy", "mysterious", "energetic"]),
          targetAudience: z.string(),
        }),
        socialLinks: z.object({
          twitter: z.string().url().optional(),
          telegram: z.string().url().optional(),
          discord: z.string().url().optional(),
          website: z.string().url().optional(),
        }).optional(),
        contractAddress: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        console.log(`[GeneratePreview] Generating preview for ${input.projectName}`);

        try {
          // Generate preview HTML (no S3 upload, return HTML directly)
          const websiteHTML = generateWebsiteHTML(
            {
              projectName: input.projectName,
              ticker: input.ticker,
              description: input.description,
              logoUrl: input.memeImageUrl,
              bannerUrl: input.memeImageUrl, // Use original image as banner for preview
              twitterUrl: input.socialLinks?.twitter,
              telegramUrl: input.socialLinks?.telegram,
              discordUrl: input.socialLinks?.discord,
              websiteUrl: input.socialLinks?.website,
              contractAddress: input.contractAddress,
            },
            input.analysis
          );

          console.log(`[GeneratePreview] Preview generated successfully`);

          return {
            success: true,
            html: websiteHTML,
          };
        } catch (error) {
          console.error(`[GeneratePreview] Preview generation failed:`, error);
          throw error;
        }
      }),

    // AI-driven website generation
    generateWebsite: protectedProcedure
      .input(z.object({
        projectName: z.string().min(1).max(255),
        ticker: z.string().min(1).max(50),
        description: z.string().min(10).max(2000),
        memeImageUrl: z.string().url(),
        socialLinks: z.object({
          twitter: z.string().url().optional(),
          telegram: z.string().url().optional(),
          discord: z.string().url().optional(),
          website: z.string().url().optional(),
        }).optional(),
        contractAddress: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        console.log(`[GenerateWebsite] Starting generation for ${input.projectName}`);

        // 1. Create project record
        const project = await db.createProject({
          userId: ctx.user.id,
          name: input.projectName,
          description: input.description,
          ticker: input.ticker,
          userImageUrl: input.memeImageUrl,
          status: "generating",
        });

        const projectId = project.id;
        console.log(`[GenerateWebsite] Project created with ID: ${projectId}`);

        try {
          // 2. AI Analysis
          console.log(`[GenerateWebsite] Analyzing project...`);
          const analysis = await analyzeProject(
            input.memeImageUrl,
            input.projectName,
            input.ticker,
            input.description
          );
          console.log(`[GenerateWebsite] Analysis complete:`, analysis);

          // 3. Generate Assets
          console.log(`[GenerateWebsite] Generating assets...`);
          const assets = await generateProjectAssets(
            input.projectName,
            input.ticker,
            input.description,
            input.memeImageUrl,
            analysis,
            projectId
          );
          console.log(`[GenerateWebsite] Assets generated:`, assets);

          // 4. Generate Website HTML
          console.log(`[GenerateWebsite] Generating website HTML...`);
          const websiteHTML = generateWebsiteHTML(
            {
              projectName: input.projectName,
              ticker: input.ticker,
              description: input.description,
              logoUrl: assets.logoVariants.original.url,
              bannerUrl: assets.banner.url,
              twitterUrl: input.socialLinks?.twitter,
              telegramUrl: input.socialLinks?.telegram,
              discordUrl: input.socialLinks?.discord,
              websiteUrl: input.socialLinks?.website,
              contractAddress: input.contractAddress,
            },
            analysis
          );

          // 5. Upload website to S3
          console.log(`[GenerateWebsite] Uploading website to S3...`);
          const slug = input.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const websiteKey = `websites/${projectId}/${slug}/index.html`;
          const { url: websiteUrl } = await storagePut(
            websiteKey,
            websiteHTML,
            "text/html"
          );
          console.log(`[GenerateWebsite] Website uploaded: ${websiteUrl}`);

          // 6. Save assets to database
          await db.createAsset({
            projectId,
            assetType: "logo",
            fileUrl: assets.logoVariants.original.url,
            fileKey: assets.logoVariants.original.key,
          });

          await db.createAsset({
            projectId,
            assetType: "banner",
            fileUrl: assets.banner.url,
            fileKey: assets.banner.key,
          });

          await db.createAsset({
            projectId,
            assetType: "website",
            fileUrl: websiteUrl,
            fileKey: websiteKey,
          });

          // 7. Update project with results (not deployed yet, waiting for user to publish)
          await db.updateProject(projectId, {
            status: "completed",
            deploymentStatus: "not_deployed",
            aiAnalysis: analysis,
            metadata: {
              generatedAt: new Date().toISOString(),
              assets: {
                logo: assets.logoVariants.original.url,
                banner: assets.banner.url,
                website: websiteUrl,
              },
            },
          });

          console.log(`[GenerateWebsite] Generation complete for project ${projectId}`);

          return {
            success: true,
            projectId,
            websiteUrl,
            analysis,
            assets: {
              logo: assets.logoVariants.original.url,
              banner: assets.banner.url,
            },
          };
        } catch (error) {
          console.error(`[GenerateWebsite] Generation failed:`, error);
          await db.updateProjectStatus(projectId, "failed");
          throw error;
        }
      }),

    // Check subdomain availability
    checkSubdomain: protectedProcedure
      .input(z.object({
        subdomain: z.string().min(3).max(63).regex(/^[a-z0-9-]+$/),
      }))
      .mutation(async ({ input }) => {
        console.log(`[CheckSubdomain] Checking availability for: ${input.subdomain}`);

        // Check if subdomain is already taken
        const existing = await db.getProjectBySubdomain(input.subdomain);

        if (existing) {
          return {
            available: false,
            message: "This subdomain is already taken",
          };
        }

        // Check against reserved subdomains
        const reserved = [
          "www", "api", "admin", "dashboard", "app", "mail", "ftp",
          "localhost", "staging", "dev", "test", "demo", "cdn", "static",
        ];

        if (reserved.includes(input.subdomain.toLowerCase())) {
          return {
            available: false,
            message: "This subdomain is reserved",
          };
        }

        return {
          available: true,
          message: "This subdomain is available",
          fullDomain: `${input.subdomain}.ezcto.fun`,
        };
      }),

    // Publish website with subdomain
    publishWebsite: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        subdomain: z.string().min(3).max(63).regex(/^[a-z0-9-]+$/),
      }))
      .mutation(async ({ input, ctx }) => {
        console.log(`[PublishWebsite] Publishing project ${input.projectId} to ${input.subdomain}.cto.fun`);

        // 1. Verify project ownership
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }
        if (project.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        // Track if this is an edit (subdomain change)
        const isEdit = project.subdomain && project.subdomain !== input.subdomain;
        const oldSubdomain = project.subdomain;

        // 2. Check subdomain availability
        const existing = await db.getProjectBySubdomain(input.subdomain);
        if (existing && existing.id !== input.projectId) {
          throw new Error("Subdomain is already taken");
        }

        // 3. Get website HTML from assets
        const assets = await db.getAssetsByProjectId(input.projectId);
        const websiteAsset = assets.find(a => a.assetType === "website");
        if (!websiteAsset || !websiteAsset.fileUrl) {
          throw new Error("Website HTML not found. Please generate the website first.");
        }

        try {
          // 4. Update deployment status
          await db.updateProject(input.projectId, {
            deploymentStatus: "deploying",
            subdomain: input.subdomain,
          });

          // 5. Fetch HTML content from S3
          const htmlResponse = await fetch(websiteAsset.fileUrl);
          if (!htmlResponse.ok) {
            throw new Error("Failed to fetch website HTML from storage");
          }
          const htmlContent = await htmlResponse.text();

          // 6. Upload to Cloudflare R2
          const deploymentUrl = await uploadToR2(input.subdomain, htmlContent);
          const fullDomain = `${input.subdomain}.ezcto.fun`;
          
          console.log(`[PublishWebsite] Uploaded to R2, accessible at ${deploymentUrl}`);

          // 6. Update project with deployment info and record history
          const metadata = project.metadata ? 
            (typeof project.metadata === 'string' ? JSON.parse(project.metadata) : project.metadata) : 
            {};
          
          // Initialize subdomain history if not exists
          if (!metadata.subdomainHistory) {
            metadata.subdomainHistory = [];
          }

          // Record subdomain change if this is an edit
          if (isEdit && oldSubdomain) {
            metadata.subdomainHistory.push({
              from: oldSubdomain,
              to: input.subdomain,
              changedAt: new Date().toISOString(),
              changedBy: ctx.user.id,
            });
          } else if (!isEdit) {
            // First time publishing
            metadata.subdomainHistory.push({
              subdomain: input.subdomain,
              publishedAt: new Date().toISOString(),
              publishedBy: ctx.user.id,
            });
          }

          await db.updateProject(input.projectId, {
            deploymentStatus: "deployed",
            subdomain: input.subdomain,
            deploymentUrl, // Real URL: https://{subdomain}.ezcto.fun
            metadata,
          });

          console.log(`[PublishWebsite] Successfully published to ${fullDomain}`);

          return {
            success: true,
            subdomain: input.subdomain,
            fullDomain,
            deploymentUrl: websiteAsset.fileUrl,
          };
        } catch (error) {
          console.error(`[PublishWebsite] Deployment failed:`, error);
          await db.updateProject(input.projectId, {
            deploymentStatus: "failed",
          });
          throw error;
        }
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

  // Custom Orders
  customOrder: router({
    uploadFile: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileType: z.string(),
        base64Data: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Convert base64 to buffer
          const base64WithoutPrefix = input.base64Data.replace(/^data:[^;]+;base64,/, "");
          const buffer = Buffer.from(base64WithoutPrefix, "base64");
          
          // Generate unique file key
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(7);
          const fileExtension = input.fileName.split(".").pop() || "png";
          const fileKey = `custom-orders/${ctx.user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;
          
          // Upload to S3
          const { url } = await storagePut(fileKey, buffer, input.fileType);
          
          return {
            url,
            key: fileKey,
            name: input.fileName,
          };
        } catch (error) {
          console.error("Failed to upload file:", error);
          throw new Error("Failed to upload file");
        }
      }),

    create: protectedProcedure
      .input(z.object({
        productType: z.enum(["merchandise", "packaging", "manufacturing", "logistics"]),
        quantity: z.number().min(100),
        budget: z.enum(["small", "medium", "large", "enterprise"]),
        description: z.string().min(10),
        contactName: z.string().min(1),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
        fileUrls: z.array(z.object({
          url: z.string(),
          key: z.string(),
          name: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const orderId = await db.createCustomOrder({
          userId: ctx.user.id,
          ...input,
        });

        // Send notification to admin about new custom order
        const productTypeMap = {
          merchandise: "Merchandise",
          packaging: "Packaging Design",
          manufacturing: "Custom Manufacturing",
          logistics: "Logistics Service",
        };
        
        const budgetMap = {
          small: "$1K-$5K",
          medium: "$5K-$20K",
          large: "$20K-$50K",
          enterprise: "$50K+",
        };

        await notifyOwner({
          title: "🛍️ New Custom Order Received",
          content: `**Order #${orderId}**\n\n` +
            `**Customer:** ${ctx.user.name || "Unknown"} (${ctx.user.email || "No email"})\n` +
            `**Product Type:** ${productTypeMap[input.productType]}\n` +
            `**Quantity:** ${input.quantity.toLocaleString()}\n` +
            `**Budget:** ${budgetMap[input.budget]}\n` +
            `**Contact:** ${input.contactName} (${input.contactEmail})\n\n` +
            `**Description:**\n${input.description}\n\n` +
            `**Files Attached:** ${input.fileUrls?.length || 0}`,
        });

        return { orderId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getCustomOrdersByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const order = await db.getCustomOrderById(input.id);
        if (!order) {
          throw new Error("Order not found");
        }
        if (order.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error("Unauthorized");
        }
        return order;
      }),
  }),
});

export type AppRouter = typeof appRouter;
