import * as db from "./db";
import { broadcastProgress } from "./_core/progressStream";
import { analyzeProjectInput, generateWebsiteCode } from "./_core/claude";
import { generateImage } from "./_core/imageGeneration";
import { retryWithBackoff } from "./_core/retry";
import { 
  shouldSkipModule, 
  markModuleCompleted, 
  markModuleFailed, 
  getGenerationProgress,
  type GenerationModule 
} from "./resumableGeneration";
import { updateGenerationProgress, initializeSteps, updateStep, type StepProgress } from "./progressTracker";

/**
 * Launch自动化引擎核心逻辑
 * 使用Claude Opus 4.5 + Nanobanana生成完整的Meme项目启动资产包
 * 支持模块级断点续传和自动重试
 */

export interface LaunchInput {
  projectId: number;
  name: string;
  description?: string;
  ticker?: string;
  tokenomics?: string;
  styleTemplate?: string;
  userImageUrl?: string; // Primary image (for backward compatibility)
  userImages?: Array<{ url: string; key: string }>; // Multiple reference images
}

export interface LaunchOutput {
  projectId: number;
  assets: {
    paydexBanner?: string;
    xBanner?: string;
    logo?: string;
    heroBackground?: string;
    featureIcons?: string[];
    communityScene?: string;
    website?: string;
  };
  status: "completed" | "failed";
  error?: string;
}

interface AnalysisResult {
  brandStrategy: any;
  colorScheme: any;
  websiteContent: any;
  language: string;
  paydexBannerPrompt: string;
  xBannerPrompt: string;
  logoPrompt: string;
  heroBackgroundPrompt: string;
  communityScenePrompt: string;
  featureIconPrompts: string[];
}

interface ImageAssets {
  paydexBanner: { url: string; key: string };
  xBanner: { url: string; key: string };
  logo: { url: string; key: string };
  heroBackground: { url: string; key: string };
  communityScene: { url: string; key: string };
  featureIcons: Array<{ url: string; key: string }>;
}

/**
 * 主函数：执行完整的Launch自动化流程
 * 支持模块级断点续传和自动重试（每个模块最多重试3次）
 */
export async function executeLaunch(input: LaunchInput): Promise<LaunchOutput> {
  const startTime = Date.now();
  let historyId: number | undefined;
  
  try {
    // 创建生成历史记录
    const project = await db.getProjectById(input.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Initialize generation history with step tracking
    let steps = initializeSteps();
    const history = await db.createGenerationHistory({
      projectId: input.projectId,
      userId: project.userId,
      status: "generating",
      startTime: new Date(startTime),
      metadata: {
        currentStep: 'analysis',
        steps,
        progress: { current: 0, total: 100, message: 'Starting generation...' },
      },
    });
    historyId = history.id;
    
    // 更新项目状态为generating
    await db.updateProjectStatus(input.projectId, "generating");
    
    // 获取当前生成进度
    const progress = await getGenerationProgress(input.projectId);
    console.log(`[Launch] Current generation progress:`, progress);

    // ========== MODULE 1: ANALYSIS ==========
    let analysisResult: AnalysisResult;
    
    if (shouldSkipModule('analysis', progress)) {
      console.log(`[Launch] Skipping ANALYSIS module (already completed)`);
      // Load analysis from database (stored in website asset metadata)
      const existingAssets = await db.getAssetsByProjectId(input.projectId);
      const websiteAsset = existingAssets.find(a => a.assetType === 'website');
      if (!websiteAsset || !websiteAsset.metadata || !websiteAsset.metadata.analysis) {
        throw new Error("Cannot resume: analysis data not found in database");
      }
      analysisResult = websiteAsset.metadata.analysis as unknown as AnalysisResult;
    } else {
      console.log(`[Launch] Starting ANALYSIS module...`);
      steps = updateStep(steps, 'analysis', { status: 'in_progress', startTime: new Date().toISOString() });
      await updateGenerationProgress(historyId, {
        currentStep: 'analysis',
        steps,
        progress: { current: 10, total: 100, message: 'Claude Opus analyzing project...' },
      });
      broadcastProgress(input.projectId, { progress: 10, message: "Claude Opus analyzing project..." });
      
      // Retry module up to 3 times
      try {
        analysisResult = await retryWithBackoff(
          async () => {
            return await analyzeProjectInput({
              projectName: input.name,
              ticker: input.ticker || "",
              description: input.description || "",
              memeImageUrl: input.userImageUrl,
              tokenomics: input.tokenomics,
            });
          },
          {
            maxRetries: 3,
            initialDelayMs: 1000,
            onRetry: (error, attempt) => {
              console.log(`[Launch] ANALYSIS module retry ${attempt}/3: ${error.message}`);
              broadcastProgress(input.projectId, { 
                progress: 10, 
                message: `Retrying analysis (${attempt}/3)...` 
              });
            },
          }
        );
        
        // Save analysis result to database (as metadata in website asset)
        // Create a placeholder website asset to store analysis data
        await db.createAsset({
          projectId: input.projectId,
          assetType: 'website',
          fileUrl: '', // No file yet
          fileKey: '',
          textContent: '', // No content yet
          metadata: { analysis: analysisResult } as any,
        });
        
        await markModuleCompleted(input.projectId, 'analysis');
        steps = updateStep(steps, 'analysis', { status: 'completed', endTime: new Date().toISOString() });
        await updateGenerationProgress(historyId, {
          currentStep: 'images',
          steps,
          progress: { current: 20, total: 100, message: 'Analysis completed' },
        });
        console.log(`[Launch] ANALYSIS module completed`);
      } catch (error) {
        await markModuleFailed(input.projectId, 'analysis');
        throw new Error(`ANALYSIS module failed after 3 retries: ${(error as Error).message}`);
      }
    }

    // ========== MODULE 2: IMAGES ==========
    let imageAssets: ImageAssets;
    
    if (shouldSkipModule('images', progress)) {
      console.log(`[Launch] Skipping IMAGES module (already completed)`);
      // Load images from database
      const existingAssets = await db.getAssetsByProjectId(input.projectId);
      imageAssets = {
        paydexBanner: {
          url: existingAssets.find(a => a.assetType === 'paydex_banner')?.fileUrl ?? '',
          key: existingAssets.find(a => a.assetType === 'paydex_banner')?.fileKey ?? '',
        },
        xBanner: {
          url: existingAssets.find(a => a.assetType === 'x_banner')?.fileUrl ?? '',
          key: existingAssets.find(a => a.assetType === 'x_banner')?.fileKey ?? '',
        },
        logo: {
          url: existingAssets.find(a => a.assetType === 'logo')?.fileUrl ?? '',
          key: existingAssets.find(a => a.assetType === 'logo')?.fileKey ?? '',
        },
        heroBackground: {
          url: existingAssets.find(a => a.assetType === 'hero_background')?.fileUrl ?? '',
          key: existingAssets.find(a => a.assetType === 'hero_background')?.fileKey ?? '',
        },
        communityScene: {
          url: existingAssets.find(a => a.assetType === 'community_scene')?.fileUrl ?? '',
          key: existingAssets.find(a => a.assetType === 'community_scene')?.fileKey ?? '',
        },
        featureIcons: existingAssets
          .filter(a => a.assetType === 'feature_icon')
          .sort((a: any, b: any) => (a.metadata?.index || 0) - (b.metadata?.index || 0))
          .map(a => ({ url: a.fileUrl ?? '', key: a.fileKey ?? '' })),
      };
    } else {
      console.log(`[Launch] Starting IMAGES module...`);
      steps = updateStep(steps, 'images', { status: 'in_progress', startTime: new Date().toISOString() });
      await updateGenerationProgress(historyId, {
        currentStep: 'images',
        steps,
        progress: { current: 30, total: 100, message: 'Generating images with Nanobanana...' },
      });
      broadcastProgress(input.projectId, { progress: 30, message: "Generating images with Nanobanana..." });
      
      // Retry module up to 3 times
      try {
        imageAssets = await retryWithBackoff(
          async () => {
            // Generate all images serially (to save incrementally)
            const imageGenerationTasks = [
              { type: 'paydexBanner', prompt: analysisResult.paydexBannerPrompt, size: "1500x500" },
              { type: 'xBanner', prompt: analysisResult.xBannerPrompt, size: "1200x480" },
              { type: 'logo', prompt: analysisResult.logoPrompt, size: "512x512" },
              { type: 'heroBackground', prompt: analysisResult.heroBackgroundPrompt, size: "1920x1080" },
              { type: 'communityScene', prompt: analysisResult.communityScenePrompt, size: "800x600" },
              ...analysisResult.featureIconPrompts.map((prompt, index) => ({
                type: 'featureIcon',
                index,
                prompt,
                size: "256x256",
              })),
            ];

            const results: any = {
              paydexBanner: null,
              xBanner: null,
              logo: null,
              heroBackground: null,
              communityScene: null,
              featureIcons: [],
            };

            for (const task of imageGenerationTasks) {
              console.log(`[Launch] Generating ${task.type}...`);
              const result = await generateImage({
                prompt: task.prompt,
                size: task.size as any,
              });

              const assetData = {
                url: result.url!,
                key: `projects/${input.projectId}/${task.type}.png`,
              };

              // Save to database immediately
              const assetTypeDb = task.type === 'paydexBanner' ? 'paydex_banner'
                : task.type === 'xBanner' ? 'x_banner'
                : task.type === 'heroBackground' ? 'hero_background'
                : task.type === 'communityScene' ? 'community_scene'
                : task.type === 'featureIcon' ? 'feature_icon'
                : task.type;

              await db.createAsset({
                projectId: input.projectId,
                assetType: assetTypeDb as any,
                fileUrl: assetData.url,
                fileKey: assetData.key,
                metadata: task.type === 'featureIcon' ? { index: (task as any).index } : undefined,
              });

              // Store in results
              if (task.type === 'featureIcon') {
                results.featureIcons.push(assetData);
              } else {
                results[task.type] = assetData;
              }

              console.log(`[Launch] Saved ${task.type} to database`);
            }

            return results;
          },
          {
            maxRetries: 3,
            initialDelayMs: 2000,
            onRetry: (error, attempt) => {
              console.log(`[Launch] IMAGES module retry ${attempt}/3: ${error.message}`);
              broadcastProgress(input.projectId, { 
                progress: 30, 
                message: `Retrying image generation (${attempt}/3)...` 
              });
            },
          }
        );
        
        await markModuleCompleted(input.projectId, 'images');
        steps = updateStep(steps, 'images', { status: 'completed', endTime: new Date().toISOString(), data: { count: 8 } });
        await updateGenerationProgress(historyId, {
          currentStep: 'website',
          steps,
          progress: { current: 70, total: 100, message: 'Images completed' },
        });
        console.log(`[Launch] IMAGES module completed`);
      } catch (error) {
        await markModuleFailed(input.projectId, 'images');
        throw new Error(`IMAGES module failed after 3 retries: ${(error as Error).message}`);
      }
    }

    // ========== MODULE 3: WEBSITE_CODE ==========
    let websiteHTML: string;
    
    if (shouldSkipModule('website_code', progress)) {
      console.log(`[Launch] Skipping WEBSITE_CODE module (already completed)`);
      // Load website from database
      const existingAssets = await db.getAssetsByProjectId(input.projectId);
      const websiteAsset = existingAssets.find(a => a.assetType === 'website');
      if (!websiteAsset || !websiteAsset.textContent) {
        throw new Error("Cannot resume: website code not found in database");
      }
      websiteHTML = websiteAsset.textContent;
    } else {
      console.log(`[Launch] Starting WEBSITE_CODE module...`);
      steps = updateStep(steps, 'website', { status: 'in_progress', startTime: new Date().toISOString() });
      await updateGenerationProgress(historyId, {
        currentStep: 'website',
        steps,
        progress: { current: 80, total: 100, message: 'Generating website code...' },
      });
      broadcastProgress(input.projectId, { progress: 80, message: "Generating website code..." });
      
      // Retry module up to 3 times
      try {
        websiteHTML = await retryWithBackoff(
          async () => {
            return await generateWebsiteCode({
              projectName: input.name,
              ticker: input.ticker || "",
              description: input.description || "",
              language: analysisResult.language,
              brandStrategy: analysisResult.brandStrategy,
              colorScheme: analysisResult.colorScheme,
              websiteContent: analysisResult.websiteContent,
              paydexBannerUrl: imageAssets.paydexBanner.url,
              xBannerUrl: imageAssets.xBanner.url,
              logoUrl: imageAssets.logo.url,
              heroBackgroundUrl: imageAssets.heroBackground.url,
              featureIconUrls: imageAssets.featureIcons.map(i => i.url),
              communitySceneUrl: imageAssets.communityScene.url,
            });
          },
          {
            maxRetries: 3,
            initialDelayMs: 1000,
            onRetry: (error, attempt) => {
              console.log(`[Launch] WEBSITE_CODE module retry ${attempt}/3: ${error.message}`);
              broadcastProgress(input.projectId, { 
                progress: 80, 
                message: `Retrying website generation (${attempt}/3)...` 
              });
            },
          }
        );
        
        // Save website to database
        await db.createAsset({
          projectId: input.projectId,
          assetType: 'website',
          textContent: websiteHTML,
        });
        
        await markModuleCompleted(input.projectId, 'website_code');
        steps = updateStep(steps, 'website', { status: 'completed', endTime: new Date().toISOString() });
        await updateGenerationProgress(historyId, {
          currentStep: 'deployment',
          steps,
          progress: { current: 95, total: 100, message: 'Website code completed' },
        });
        console.log(`[Launch] WEBSITE_CODE module completed`);
      } catch (error) {
        await markModuleFailed(input.projectId, 'website_code');
        throw new Error(`WEBSITE_CODE module failed after 3 retries: ${(error as Error).message}`);
      }
    }

    // ========== FINALIZATION ==========
    steps = updateStep(steps, 'deployment', { status: 'completed', endTime: new Date().toISOString() });
    await updateGenerationProgress(historyId, {
      currentStep: 'deployment',
      steps,
      progress: { current: 100, total: 100, message: 'All assets generated successfully!' },
    });
    broadcastProgress(input.projectId, { progress: 100, message: "All assets generated successfully!" });

    // 更新项目状态为completed
    await db.updateProjectStatus(input.projectId, "completed");
    
    // 更新生成历史记录为completed
    if (historyId) {
      await db.updateGenerationHistory(historyId, {
        status: "completed",
        endTime: new Date(),
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[Launch] Generation completed in ${(duration / 1000).toFixed(1)}s`);

    return {
      projectId: input.projectId,
      assets: {
        paydexBanner: imageAssets.paydexBanner.url,
        xBanner: imageAssets.xBanner.url,
        logo: imageAssets.logo.url,
        heroBackground: imageAssets.heroBackground.url,
        featureIcons: imageAssets.featureIcons.map(i => i.url),
        communityScene: imageAssets.communityScene.url,
        website: websiteHTML,
      },
      status: "completed",
    };

  } catch (error) {
    console.error(`[Launch] Generation failed:`, error);
    
    // 更新项目状态为failed
    await db.updateProjectStatus(input.projectId, "failed");
    
    // 更新生成历史记录为failed
    if (historyId) {
      await db.updateGenerationHistory(historyId, {
        status: "failed",
        endTime: new Date(),
        errorMessage: (error as Error).message,
      });
    }

    broadcastProgress(input.projectId, { 
      progress: 0, 
      message: `Generation failed: ${(error as Error).message}` 
    });

    return {
      projectId: input.projectId,
      assets: {},
      status: "failed",
      error: (error as Error).message,
    };
  }
}
