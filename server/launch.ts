import * as db from "./db";
import { broadcastProgress } from "./_core/progressStream";
import { analyzeProjectInput, generateWebsiteCode } from "./_core/claude";
import { generateImage } from "./_core/imageGeneration";
import { retryWithBackoff } from "./_core/retry";
import { generateSubdomain, deployWebsite } from "./_core/deployment";
import { uploadBufferToR2 } from "./_core/imageUpload";
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

// R2公开访问URL，用于Dashboard图片展示
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://assets.ezcto.fun';

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
    featureIcon?: string; // Changed from array to single icon
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
  featureIconPrompt: string;
  communityScenePrompt?: string; // New: prompt for community scene image
}

// Image asset with both URL (for DB storage) and Buffer (for R2 upload)
interface ImageAssetWithBuffer {
  url: string;
  key: string;
  buffer?: Buffer; // Buffer for direct R2 upload
}

interface ImageAssets {
  paydexBanner: ImageAssetWithBuffer;
  xBanner: ImageAssetWithBuffer;
  logo: ImageAssetWithBuffer; // Now uses user uploaded image, not generated
  heroBackground: ImageAssetWithBuffer;
  featureIcon: ImageAssetWithBuffer;
  communityScene: ImageAssetWithBuffer; // New: 800x600 community scene image
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
      broadcastProgress(input.projectId, { 
        progress: 10, 
        message: "Claude Opus analyzing project...",
        category: "analysis",
        level: "info",
        timestamp: new Date().toISOString()
      });
      
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
                message: `Retrying analysis (${attempt}/3)...`,
                category: "analysis",
                level: "warning",
                timestamp: new Date().toISOString()
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
      // Load images from database (note: buffers are not stored, will need to re-download for deployment)
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
        featureIcon: {
          url: existingAssets.find(a => a.assetType === 'feature_icon')?.fileUrl ?? '',
          key: existingAssets.find(a => a.assetType === 'feature_icon')?.fileKey ?? '',
        },
        communityScene: {
          url: existingAssets.find(a => a.assetType === 'community_scene')?.fileUrl ?? '',
          key: existingAssets.find(a => a.assetType === 'community_scene')?.fileKey ?? '',
        },
      };
    } else {
      console.log(`[Launch] Starting IMAGES module...`);
      steps = updateStep(steps, 'images', { status: 'in_progress', startTime: new Date().toISOString() });
      await updateGenerationProgress(historyId, {
        currentStep: 'images',
        steps,
        progress: { current: 30, total: 100, message: 'Generating images with Nanobanana...' },
      });
      broadcastProgress(input.projectId, { 
        progress: 30, 
        message: "Generating images with Nanobanana...",
        category: "images",
        level: "info",
        timestamp: new Date().toISOString()
      });
      
      // Retry module up to 3 times
      try {
        imageAssets = await retryWithBackoff(
          async () => {
            // Generate all images serially (to save incrementally)
            // Logo uses user uploaded image, not generated by Nanobanana
            // Get user uploaded image URL from input
            const userLogoUrl = input.userImageUrl || input.userImages?.[0]?.url || '';
            const userLogoKey = input.userImages?.[0]?.key || `projects/${input.projectId}/logo.png`;
            
            const imageGenerationTasks = [
              { type: 'paydexBanner', prompt: analysisResult.paydexBannerPrompt, size: "1500x500" },
              { type: 'xBanner', prompt: analysisResult.xBannerPrompt, size: "1200x480" },
              // Logo is NOT generated - uses user uploaded image
              { type: 'heroBackground', prompt: analysisResult.heroBackgroundPrompt, size: "1920x1080" },
              { type: 'featureIcon', prompt: analysisResult.featureIconPrompt, size: "256x256" },
              { type: 'communityScene', prompt: analysisResult.communityScenePrompt || `A vibrant community scene for ${input.name}, showing enthusiastic supporters and community members in the style of ${analysisResult.brandStrategy?.visualStyle || 'modern digital art'}, 800x600 aspect ratio`, size: "800x600" },
            ];

            const results: ImageAssets = {
              paydexBanner: { url: '', key: '' },
              xBanner: { url: '', key: '' },
              logo: { url: userLogoUrl, key: userLogoKey }, // Use user uploaded image
              heroBackground: { url: '', key: '' },
              featureIcon: { url: '', key: '' },
              communityScene: { url: '', key: '' },
            };
            
            // Download user logo and save buffer for R2 upload
            let logoBuffer: Buffer | undefined;
            if (userLogoUrl) {
              try {
                console.log(`[Launch] Downloading user logo from: ${userLogoUrl}`);
                const logoResponse = await fetch(userLogoUrl);
                if (logoResponse.ok) {
                  logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
                  console.log(`[Launch] Downloaded user logo, buffer size: ${logoBuffer.length}`);
                } else {
                  console.warn(`[Launch] Failed to download user logo: ${logoResponse.statusText}`);
                }
              } catch (error) {
                console.warn(`[Launch] Error downloading user logo:`, error);
              }
              
              // Save logo asset to database
              await db.createAsset({
                projectId: input.projectId,
                assetType: 'logo',
                fileUrl: userLogoUrl,
                fileKey: userLogoKey,
              });
              console.log(`[Launch] Using user uploaded image as logo: ${userLogoUrl}`);
            }

            const totalImages = imageGenerationTasks.length;

            console.log(`[Launch] Starting batch generation of ${totalImages} images (2 images per batch)...`);

            // Track completed images
            const completedImageTypes = new Set<string>();
            const completedTasks: Array<{ task: any; assetData: ImageAssetWithBuffer }> = [];

            // Generate images in batches of 2 to avoid rate limits
            const BATCH_SIZE = 2;
            const BATCH_DELAY_MS = 2000; // 2 seconds delay between batches

            for (let i = 0; i < imageGenerationTasks.length; i += BATCH_SIZE) {
              const batch = imageGenerationTasks.slice(i, i + BATCH_SIZE);
              console.log(`[Launch] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(imageGenerationTasks.length / BATCH_SIZE)}...`);

              // Generate images in current batch (parallel within batch)
              const batchPromises = batch.map(async (task) => {
                console.log(`[Launch] Starting generation of ${task.type}...`);
                
                // generateImage now returns both url and buffer
                const result = await generateImage({
                  prompt: task.prompt,
                  size: task.size as any,
                });

                const assetData: ImageAssetWithBuffer = {
                  url: result.url!,
                  key: `projects/${input.projectId}/${task.type}.png`,
                  buffer: result.buffer, // Keep buffer for R2 upload
                };

                // Save to database immediately (URL only, buffer is transient)
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

                console.log(`[Launch] Saved ${task.type} to database`);
                
                // Update progress after each image completes
                const taskKey = task.type === 'featureIcon' ? `${task.type}_${(task as any).index}` : task.type;
                completedImageTypes.add(taskKey);
                const completedCount = completedImageTypes.size;
                const progressPercent = 30 + Math.floor((completedCount / totalImages) * 40); // 30-70%
                
                if (historyId) {
                  await updateGenerationProgress(historyId, {
                    currentStep: 'images',
                    steps,
                    progress: { 
                      current: progressPercent, 
                      total: 100, 
                      message: `Generated ${completedCount}/${totalImages} images` 
                    },
                  });
                }
                broadcastProgress(input.projectId, { 
                  progress: progressPercent, 
                  message: `Generated ${completedCount}/${totalImages} images (${task.type})`,
                  category: "images",
                  level: "success",
                  timestamp: new Date().toISOString()
                });

                return { task, assetData };
              });

              // Wait for current batch to complete
              const batchResults = await Promise.all(batchPromises);
              completedTasks.push(...batchResults);

              // Add delay between batches (except for the last batch)
              if (i + BATCH_SIZE < imageGenerationTasks.length) {
                console.log(`[Launch] Waiting ${BATCH_DELAY_MS}ms before next batch...`);
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
              }
            }

            // Organize results (including buffers)
            for (const { task, assetData } of completedTasks) {
              (results as any)[task.type] = assetData;
            }

            // Add logo buffer to results (logo uses user uploaded image, not generated)
            if (logoBuffer) {
              results.logo.buffer = logoBuffer;
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
        steps = updateStep(steps, 'images', { status: 'completed', endTime: new Date().toISOString(), data: { count: 5 } });
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
      broadcastProgress(input.projectId, { 
        progress: 80, 
        message: "Generating website code...",
        category: "website",
        level: "info",
        timestamp: new Date().toISOString()
      });
      
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
              featureIconUrl: imageAssets.featureIcon.url,
              communitySceneUrl: imageAssets.communityScene?.url || '',
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

    // ========== FINALIZATION: DEPLOY TO SUBDOMAIN ==========
    steps = updateStep(steps, 'deployment', { status: 'in_progress', startTime: new Date().toISOString() });
    await updateGenerationProgress(historyId, {
      currentStep: 'deployment',
      steps,
      progress: { current: 90, total: 100, message: 'Uploading images to R2...' },
    });
    broadcastProgress(input.projectId, { 
      progress: 90, 
      message: "Uploading images to R2...",
      category: "deployment",
      level: "info",
      timestamp: new Date().toISOString()
    });

    // Generate subdomain
    const subdomain = generateSubdomain(input.name, input.ticker);

    // Upload all images to R2 using buffers directly (no re-download needed!)
    // Map of image type to R2 relative URL
    const uploadedImages: Record<string, string> = {};

    // Helper to upload a single image
    const uploadImageToR2Helper = async (
      asset: ImageAssetWithBuffer, 
      imageName: string
    ): Promise<string> => {
      if (asset.buffer) {
        // Use buffer directly - no download needed!
        console.log(`[Launch] Uploading ${imageName} to R2 using buffer...`);
        const result = await uploadBufferToR2(asset.buffer, subdomain, imageName);
        return result.url;
      } else {
        // Fallback: download from URL (for resumed generations)
        console.log(`[Launch] Downloading ${imageName} from URL for R2 upload...`);
        const response = await fetch(asset.url);
        if (!response.ok) {
          throw new Error(`Failed to download ${imageName}: ${response.statusText}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        const result = await uploadBufferToR2(buffer, subdomain, imageName);
        return result.url;
      }
    };

    // Upload all images
    uploadedImages['paydex-banner.png'] = await uploadImageToR2Helper(imageAssets.paydexBanner, 'paydex-banner.png');
    uploadedImages['x-banner.png'] = await uploadImageToR2Helper(imageAssets.xBanner, 'x-banner.png');
    uploadedImages['logo.png'] = await uploadImageToR2Helper(imageAssets.logo, 'logo.png');
    uploadedImages['hero-background.png'] = await uploadImageToR2Helper(imageAssets.heroBackground, 'hero-background.png');
    uploadedImages['feature-icon.png'] = await uploadImageToR2Helper(imageAssets.featureIcon, 'feature-icon.png');
    // Upload communityScene if it exists
    if (imageAssets.communityScene?.url) {
      uploadedImages['community-scene.png'] = await uploadImageToR2Helper(imageAssets.communityScene, 'community-scene.png');
    }

    console.log(`[Launch] Uploaded ${Object.keys(uploadedImages).length} images to R2`);

    // Replace image URLs in HTML with relative paths
    let finalHTML = websiteHTML;
    finalHTML = finalHTML.replace(new RegExp(escapeRegExp(imageAssets.paydexBanner.url), 'g'), uploadedImages['paydex-banner.png']);
    finalHTML = finalHTML.replace(new RegExp(escapeRegExp(imageAssets.xBanner.url), 'g'), uploadedImages['x-banner.png']);
    finalHTML = finalHTML.replace(new RegExp(escapeRegExp(imageAssets.logo.url), 'g'), uploadedImages['logo.png']);
    finalHTML = finalHTML.replace(new RegExp(escapeRegExp(imageAssets.heroBackground.url), 'g'), uploadedImages['hero-background.png']);
    finalHTML = finalHTML.replace(new RegExp(escapeRegExp(imageAssets.featureIcon.url), 'g'), uploadedImages['feature-icon.png']);
    // Replace communityScene URL if it exists
    if (imageAssets.communityScene?.url && uploadedImages['community-scene.png']) {
      finalHTML = finalHTML.replace(new RegExp(escapeRegExp(imageAssets.communityScene.url), 'g'), uploadedImages['community-scene.png']);
    }

    broadcastProgress(input.projectId, { 
      progress: 95, 
      message: "Deploying website to subdomain...",
      category: "deployment",
      level: "info",
      timestamp: new Date().toISOString()
    });

    // Deploy website with relative image paths
    const deploymentResult = await deployWebsite(input.projectId, subdomain, finalHTML);

    // Construct assetsBaseUrl for Dashboard image display
    const assetsBaseUrl = `${R2_PUBLIC_URL}/${subdomain}`;
    console.log(`[Launch] Assets base URL: ${assetsBaseUrl}`);

    // Update assets table with R2 public URLs for Dashboard display
    // Map asset types to their R2 filenames
    const assetR2Mapping: Record<string, string> = {
      'paydex_banner': 'paydex-banner.png',
      'x_banner': 'x-banner.png',
      'logo': 'logo.png',
      'hero_background': 'hero-background.png',
      'feature_icon': 'feature-icon.png',
      'community_scene': 'community-scene.png',
    };

    // Update each asset's fileUrl to use R2 public URL
    for (const [assetType, filename] of Object.entries(assetR2Mapping)) {
      // Skip if image was not uploaded (e.g., communityScene might not exist)
      if (!uploadedImages[filename]) {
        console.log(`[Launch] Skipping ${assetType} - not uploaded`);
        continue;
      }
      const r2PublicUrl = `${assetsBaseUrl}${uploadedImages[filename]}`; // uploadedImages contains /assets/xxx.png
      await db.updateAssetFileUrl(input.projectId, assetType as any, r2PublicUrl);
      console.log(`[Launch] Updated ${assetType} fileUrl to ${r2PublicUrl}`);
    }

    if (deploymentResult.success) {
      // Update project with deployment info and assetsBaseUrl
      await db.updateProject(input.projectId, {
        subdomain: deploymentResult.subdomain,
        deploymentUrl: deploymentResult.deploymentUrl,
        assetsBaseUrl: assetsBaseUrl, // For Dashboard image display
        deploymentStatus: 'deployed',
      });
      console.log(`[Launch] Website deployed to ${deploymentResult.deploymentUrl}`);
    } else {
      // Deployment failed, but generation succeeded - still save assetsBaseUrl
      await db.updateProject(input.projectId, {
        subdomain: deploymentResult.subdomain,
        assetsBaseUrl: assetsBaseUrl, // Assets are still accessible even if deployment failed
        deploymentStatus: 'failed',
      });
      console.error(`[Launch] Deployment failed: ${deploymentResult.error}`);
    }

    steps = updateStep(steps, 'deployment', { status: 'completed', endTime: new Date().toISOString() });
    await updateGenerationProgress(historyId, {
      currentStep: 'deployment',
      steps,
      progress: { current: 100, total: 100, message: 'All assets generated and deployed!' },
    });
    broadcastProgress(input.projectId, { 
      progress: 100, 
      message: "All assets generated and deployed!",
      category: "deployment",
      level: "success",
      timestamp: new Date().toISOString()
    });

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
        featureIcon: imageAssets.featureIcon.url,
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

// Helper function to escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
