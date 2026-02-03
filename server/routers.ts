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
import { generateAssetsWithClaude } from "./claudeAssetGenerator";
import { createCheckoutSession, createSubscriptionCheckoutSession } from "./stripe";
import { ALL_PRODUCTS } from "./products";
import { storagePut } from "./storage";
import { removeBackground } from "./_core/backgroundRemoval";
import { notifyOwner } from "./_core/notification";
import { uploadToR2, uploadPreviewToR2 } from "./cloudflareR2";
import { cryptoRouter } from "./routers/crypto";
import { adminRouter } from "./routers/admin";
import { walletRouter } from "./routers/wallet";
import { enhanceDescription } from "./_core/claude";
import { checkSlugAvailability, migrateSlugAssets } from "./_core/deployment";
import { verifyBSCPayment, verifySolanaPayment, pollPaymentConfirmation } from "./_core/paymentVerification";
import { calculatePrice } from "../shared/paymentConfig";

export const appRouter = router({
  system: systemRouter,
  crypto: cryptoRouter,
  admin: adminRouter,
  wallet: walletRouter,
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

    // Check if user has a project currently generating
    getGenerating: protectedProcedure.query(async ({ ctx }) => {
      const project = await db.getUserGeneratingProject(ctx.user.id);
      // Return null instead of undefined to satisfy tRPC query requirements
      return project ?? null;
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
        tokenomics: z.string().optional(),
        contractAddress: z.string().max(100).optional(),
        // Social links
        twitterUrl: z.string().max(500).optional(),
        telegramUrl: z.string().max(500).optional(),
        discordUrl: z.string().max(500).optional(),
        styleTemplate: z.string().max(100).optional(),
        userImageUrl: z.string().optional(),
        userImageKey: z.string().optional(),
        userImages: z.string().optional(), // JSON string of array
      }))
      .mutation(async ({ input, ctx }) => {
        // Check free quota
        const user = await db.getUserById(ctx.user.id);
        if (!user) {
          throw new Error("User not found");
        }
        
        // "Latest First" Strategy: Check for incomplete projects and supersede them
        const isAdmin = user.role === 'admin';
        let inheritedPayment = false;
        
        if (!isAdmin) {
          // Check for incomplete paid projects (can be superseded)
          const incompleteProjects = await db.getIncompleteProjectsByUserId(ctx.user.id);
          if (incompleteProjects.length > 0) {
            // Will supersede the most recent incomplete project after creating new one
            console.log(`[Create] Found ${incompleteProjects.length} incomplete project(s), will supersede`);
            inheritedPayment = true;
          } else {
            // Check for unpaid projects (old logic for free quota)
            const unpaidProjects = await db.getUnpaidProjectsByUserId(ctx.user.id);
            if (unpaidProjects.length > 0 && user.freeGenerationsUsed >= 1) {
              throw new Error("FREE_QUOTA_EXCEEDED: Please unlock your previous project before creating a new one.");
            }
          }
        }
        const project = await db.createProject({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          ticker: input.ticker,
          tokenomics: input.tokenomics,
          contractAddress: input.contractAddress,
          // Social links
          twitterUrl: input.twitterUrl,
          telegramUrl: input.telegramUrl,
          discordUrl: input.discordUrl,
          styleTemplate: input.styleTemplate,
          userImageUrl: input.userImageUrl,
          userImageKey: input.userImageKey,
          userImages: input.userImages ? JSON.parse(input.userImages) : null,
          status: "draft",
          paymentStatus: isAdmin ? "paid" : "unpaid",
          paymentAmount: isAdmin ? "0" : null,
          paymentCurrency: isAdmin ? "TEST" : null,
          paidAt: isAdmin ? new Date() : null,
        });
        const projectId = project.id;
        
        // Supersede incomplete projects and transfer payment
        if (inheritedPayment && !isAdmin) {
          const incompleteProjects = await db.getIncompleteProjectsByUserId(ctx.user.id);
          for (const oldProject of incompleteProjects) {
            if (oldProject.id !== projectId) {
              await db.supersedeProject(oldProject.id, projectId);
              console.log(`[Create] Superseded project ${oldProject.id} with new project ${projectId}`);
            }
          }
        }
        
        // Increment free generations counter (only if not inheriting payment)
        if (!inheritedPayment && user.freeGenerationsUsed < 1) {
          await db.updateUserFreeGenerations(ctx.user.id, 1);
        }
        
        // Trigger launch automation in background
        if (projectId) {
          executeLaunch({
            projectId,
            name: input.name,
            description: input.description,
            ticker: input.ticker,
            tokenomics: input.tokenomics,
            // Social links
            twitterUrl: input.twitterUrl,
            telegramUrl: input.telegramUrl,
            discordUrl: input.discordUrl,
            styleTemplate: input.styleTemplate,
            userImageUrl: input.userImageUrl,
            userImages: input.userImages ? JSON.parse(input.userImages) : undefined,
          }).catch(error => {
            console.error("[Launch] Background execution failed:", error);
          });
        }
        
        return { success: true, projectId };
      }),

    getPaidProjects: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserPaidProjects(ctx.user.id);
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

    deleteHistory: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verify the history record belongs to the user
        const history = await db.getGenerationHistoryById(input.id);
        if (!history) {
          throw new Error("History record not found");
        }
        if (history.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error("Unauthorized");
        }
        await db.deleteGenerationHistory(input.id);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verify the project belongs to the user
        const project = await db.getProjectById(input.id);
        if (!project) {
          throw new Error("Project not found");
        }
        if (project.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error("Unauthorized");
        }
        await db.deleteProject(input.id);
        return { success: true };
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
          // 2-4. Claude-coordinated generation (Analysis + Assets + Website)
          console.log(`[GenerateWebsite] Starting Claude-coordinated generation...`);
          const claudeAssets = await generateAssetsWithClaude(
            input.projectName,
            input.ticker,
            input.description,
            input.memeImageUrl,
            projectId
          );
          console.log(`[GenerateWebsite] Claude generation complete`);

          const websiteHTML = claudeAssets.websiteHTML;

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
            fileUrl: claudeAssets.logo.url,
            fileKey: claudeAssets.logo.key,
          });

          await db.createAsset({
            projectId,
            assetType: "paydex_banner",
            fileUrl: claudeAssets.paydexBanner.url,
            fileKey: claudeAssets.paydexBanner.key,
          });

          await db.createAsset({
            projectId,
            assetType: "x_banner",
            fileUrl: claudeAssets.xBanner.url,
            fileKey: claudeAssets.xBanner.key,
          });

          await db.createAsset({
            projectId,
            assetType: "hero_background",
            fileUrl: claudeAssets.heroBackground.url,
            fileKey: claudeAssets.heroBackground.key,
          });

          // Save feature icon
          await db.createAsset({
            projectId,
            assetType: "feature_icon",
            fileUrl: claudeAssets.featureIcon.url,
            fileKey: claudeAssets.featureIcon.key,
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
            aiAnalysis: {
              brandStrategy: claudeAssets.brandStrategy,
              colorScheme: claudeAssets.colorScheme,
              websiteContent: claudeAssets.websiteContent,
            } as any,
            metadata: {
              generatedAt: new Date().toISOString(),
              assets: {
                logo: claudeAssets.logo.url,
                paydexBanner: claudeAssets.paydexBanner.url,
                xBanner: claudeAssets.xBanner.url,
                heroBackground: claudeAssets.heroBackground.url,
                featureIcon: claudeAssets.featureIcon.url,
                website: websiteUrl,
              },
            },
          });

          console.log(`[GenerateWebsite] Generation complete for project ${projectId}`);

          return {
            success: true,
            projectId,
            websiteUrl,
            analysis: {
              brandStrategy: claudeAssets.brandStrategy,
              colorScheme: claudeAssets.colorScheme,
              websiteContent: claudeAssets.websiteContent,
            },
            assets: {
              logo: claudeAssets.logo.url,
              paydexBanner: claudeAssets.paydexBanner.url,
              xBanner: claudeAssets.xBanner.url,
              heroBackground: claudeAssets.heroBackground.url,
              featureIcon: claudeAssets.featureIcon.url,
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

    // Preview website before publishing
    previewWebsite: protectedProcedure
      .input(z.object({
        projectId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        console.log(`[PreviewWebsite] Creating preview for project ${input.projectId}`);

        // 1. Verify project ownership
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }
        if (project.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        // 2. Get website HTML from assets
        const assets = await db.getAssetsByProjectId(input.projectId);
        const websiteAsset = assets.find(a => a.assetType === "website");
        
        // Check for HTML content - prefer textContent (stored directly), fallback to fileUrl (S3)
        let htmlContent: string | null = null;
        
        if (websiteAsset?.textContent) {
          htmlContent = websiteAsset.textContent;
          console.log(`[PreviewWebsite] Using textContent from database (${htmlContent.length} chars)`);
        } else if (websiteAsset?.fileUrl) {
          console.log(`[PreviewWebsite] Fetching HTML from S3: ${websiteAsset.fileUrl}`);
          const htmlResponse = await fetch(websiteAsset.fileUrl);
          if (htmlResponse.ok) {
            htmlContent = await htmlResponse.text();
            console.log(`[PreviewWebsite] Fetched HTML from S3 (${htmlContent.length} chars)`);
          }
        }
        
        if (!htmlContent) {
          throw new Error("Website HTML not found. Please generate the website first.");
        }

        try {
          // 3. Upload to R2 preview path
          const previewUrl = await uploadPreviewToR2(input.projectId, htmlContent);
          console.log(`[PreviewWebsite] Preview uploaded to: ${previewUrl}`);

          return {
            success: true,
            previewUrl,
            expiresIn: "24 hours", // Preview links are temporary
          };
        } catch (error) {
          console.error(`[PreviewWebsite] Preview creation failed:`, error);
          throw new Error("Failed to create preview. Please try again.");
        }
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
        
        // 2. Check payment status
        if (project.paymentStatus !== "paid") {
          throw new Error("PAYMENT_REQUIRED: Please unlock this project to publish the website.");
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
        
        // Check for HTML content - prefer textContent (stored directly), fallback to fileUrl (S3)
        let htmlContent: string | null = null;
        
        if (websiteAsset?.textContent) {
          // Use textContent directly (stored in database during generation)
          htmlContent = websiteAsset.textContent;
          console.log(`[PublishWebsite] Using textContent from database (${htmlContent.length} chars)`);
        } else if (websiteAsset?.fileUrl) {
          // Fallback: fetch from S3 URL
          console.log(`[PublishWebsite] Fetching HTML from S3: ${websiteAsset.fileUrl}`);
          const htmlResponse = await fetch(websiteAsset.fileUrl);
          if (htmlResponse.ok) {
            htmlContent = await htmlResponse.text();
            console.log(`[PublishWebsite] Fetched HTML from S3 (${htmlContent.length} chars)`);
          }
        }
        
        if (!htmlContent) {
          throw new Error("Website HTML not found. Please generate the website first.");
        }

        try {
          // 4. Update deployment status
          await db.updateProject(input.projectId, {
            deploymentStatus: "deploying",
            subdomain: input.subdomain,
          });

          // 5. If subdomain is changing, migrate assets first
          if (isEdit && oldSubdomain) {
            console.log(`[PublishWebsite] Subdomain changing from ${oldSubdomain} to ${input.subdomain}, migrating assets...`);
            const migrationResult = await migrateSlugAssets(oldSubdomain, input.subdomain);
            if (!migrationResult.success) {
              console.error(`[PublishWebsite] Asset migration failed:`, migrationResult.error);
              throw new Error(`Failed to migrate assets: ${migrationResult.error}`);
            }
            console.log(`[PublishWebsite] Successfully migrated ${migrationResult.copiedFiles.length} files`);
            
            // Update asset URLs in database to point to new slug
            await db.updateAssetsSlug(input.projectId, oldSubdomain, input.subdomain);
            console.log(`[PublishWebsite] Updated asset URLs in database from ${oldSubdomain} to ${input.subdomain}`);
          }

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
            deploymentUrl,
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
        
        // Check payment status
        if (project.paymentStatus !== "paid") {
          throw new Error("PAYMENT_REQUIRED: Please unlock this project to download assets.");
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

    // Proxy download to bypass CORS restrictions on R2
    proxyDownload: protectedProcedure
      .input(z.object({ 
        projectId: z.number(),
        assetType: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }
        if (project.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error("Unauthorized");
        }
        
        // Check payment status
        if (project.paymentStatus !== "paid") {
          throw new Error("PAYMENT_REQUIRED: Please unlock this project to download assets.");
        }

        const assets = await db.getAssetsByProjectId(input.projectId);
        const asset = assets.find(a => a.assetType === input.assetType);
        
        if (!asset || !asset.fileUrl) {
          throw new Error(`Asset ${input.assetType} not found`);
        }

        // Fetch the file from R2
        console.log(`[ProxyDownload] Fetching ${input.assetType} from ${asset.fileUrl}`);
        const response = await fetch(asset.fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch asset: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const contentType = response.headers.get('content-type') || 'image/png';

        console.log(`[ProxyDownload] Successfully fetched ${input.assetType}, size: ${arrayBuffer.byteLength} bytes`);

        return {
          base64,
          contentType,
          filename: `${input.assetType}.png`,
        };
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        assetType: z.enum(["logo", "banner", "paydex_banner", "x_banner", "hero_background", "feature_icon", "community_scene", "pfp", "poster", "narrative", "whitepaper", "tweet", "website"]),
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
    // Check if subdomain slug is available
    checkSlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const result = await checkSlugAvailability(input.slug);
        return result;
      }),

    // Verify crypto payment
    verifyPayment: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        txHash: z.string(),
        chain: z.enum(['bsc', 'solana']),
        walletAddress: z.string(),
        hasDiscount: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }
        if (project.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error("Unauthorized");
        }

        // Check if already paid
        if (project.paymentStatus === 'paid') {
          return { success: true, message: "Project already paid" };
        }

        // Calculate expected amount
        const expectedAmount = calculatePrice(input.hasDiscount);

        // Verify payment on blockchain
        const result = await pollPaymentConfirmation(
          input.txHash,
          input.chain,
          expectedAmount,
          input.walletAddress,
          30, // max 30 attempts
          2000 // 2 seconds interval
        );

        if (!result.success) {
          throw new Error(result.error || 'Payment verification failed');
        }

        // Update project payment status
        await db.updateProject(input.projectId, {
          paymentStatus: 'paid',
          paymentAmount: result.amount?.toString(),
          paymentCurrency: input.chain === 'bsc' ? 'USDT' : 'USDC',
          paymentTxHash: input.txHash,
          paymentWalletAddress: input.walletAddress,
          paidAt: new Date(),
        });

        return { 
          success: true, 
          message: "Payment verified successfully",
          amount: result.amount,
        };
      }),

    // Use whitelist free generation
    useWhitelistGeneration: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        walletAddress: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }
        if (project.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error("Unauthorized");
        }

        // Check whitelist status
        const whitelistStatus = await db.checkWhitelistStatus(input.walletAddress);
        if (!whitelistStatus.isWhitelisted || whitelistStatus.remainingGenerations <= 0) {
          throw new Error("No free generations available");
        }

        // Use whitelist generation
        const result = await db.useWhitelistGeneration(input.walletAddress);
        if (!result) {
          throw new Error("Failed to use whitelist generation");
        }

        // Update project payment status
        await db.updateProject(input.projectId, {
          paymentStatus: 'paid',
          paymentAmount: '0',
          paymentCurrency: 'WHITELIST',
          paymentWalletAddress: input.walletAddress,
          paidAt: new Date(),
        });

        return { 
          success: true, 
          message: "Free generation used",
          remainingGenerations: result.remainingGenerations,
        };
      }),

    trigger: protectedProcedure
      .input(z.object({ 
        projectId: z.number(),
        characterImageUrl: z.string().optional(),
        characterImageBase64: z.string().optional(), // Base64 encoded image data
      }))
      .mutation(async ({ input, ctx }) => {
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }
        if (project.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error("Unauthorized");
        }

        // Check payment status
        if (project.paymentStatus !== 'paid') {
          throw new Error("Payment required. Please complete payment before starting generation.");
        }

        // Check if there's already a generation in progress for this project
        const existingHistory = await db.getLatestGenerationHistoryByProjectId(input.projectId);
        if (existingHistory && existingHistory.status === 'generating') {
          console.log('[Launch Trigger] Generation already in progress for project:', input.projectId, 'history:', existingHistory.id);
          return { success: true, message: "Generation already in progress", alreadyInProgress: true };
        }

        // Also check if project status is already 'generating'
        if (project.status === 'generating') {
          console.log('[Launch Trigger] Project already in generating status:', input.projectId);
          return { success: true, message: "Generation already in progress", alreadyInProgress: true };
        }

        // Debug: Log received image data
        console.log('[Launch Trigger] Received characterImageBase64 length:', input.characterImageBase64?.length || 0);
        console.log('[Launch Trigger] Received characterImageUrl:', input.characterImageUrl);
        
        // Validate image data - at least one must be provided
        const hasBase64 = input.characterImageBase64 && input.characterImageBase64.length > 100;
        const hasUrl = input.characterImageUrl && input.characterImageUrl.length > 10;
        
        if (!hasBase64 && !hasUrl) {
          console.error('[Launch Trigger] No valid image data provided');
          throw new Error("IMAGE_REQUIRED: Please upload a character image before starting generation.");
        }
        
        // Validate base64 format if provided
        if (input.characterImageBase64 && !input.characterImageBase64.startsWith('data:image/')) {
          console.error('[Launch Trigger] Invalid base64 format');
          throw new Error("INVALID_IMAGE: Image data is invalid. Please re-upload the image.");
        }
        
        // Execute launch in background (non-blocking)
        executeLaunch({
          projectId: project.id,
          name: project.name,
          description: project.description || undefined,
          ticker: project.ticker || undefined,
          tokenomics: project.tokenomics || undefined,
          // Social links from project
          twitterUrl: project.twitterUrl || undefined,
          telegramUrl: project.telegramUrl || undefined,
          discordUrl: project.discordUrl || undefined,
          styleTemplate: project.styleTemplate || undefined,
          userImageUrl: input.characterImageUrl,
          userImageBase64: input.characterImageBase64, // Pass base64 to avoid 403 on CloudFront URLs
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

  // AI Enhancement
  ai: router({
    enhanceDescription: protectedProcedure
      .input(z.object({
        projectName: z.string(),
        ticker: z.string(),
        description: z.string(),
      }))
      .mutation(async ({ input }) => {
        const enhanced = await enhanceDescription({
          projectName: input.projectName,
          ticker: input.ticker,
          description: input.description,
        });
        return { enhancedDescription: enhanced };
      }),
  }),

  // Generation History (for real-time progress tracking)
  generationHistory: router({
    getByProjectId: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input, ctx }) => {
        // First verify user owns this project
        const project = await db.getProjectById(input.projectId);
        if (!project) {
          throw new Error("Project not found");
        }
        if (project.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new Error("Unauthorized");
        }
        
        // Get latest generation history for this project
        const history = await db.getLatestGenerationHistoryByProjectId(input.projectId);
        return history || null;
      }),
  }),
});

export type AppRouter = typeof appRouter;
