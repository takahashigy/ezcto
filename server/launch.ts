import * as db from "./db";
import { broadcastProgress } from "./_core/progressStream";
import { analyzeProjectInput, generateWebsiteCode, enhanceDescription } from "./_core/claude";
import { analyzeProject, type ProjectAnalysis } from "./aiAnalyzer";
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
import { removeBackgroundWithFallback } from "./_core/removeBg";

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
  // Social links
  twitterUrl?: string;
  telegramUrl?: string;
  discordUrl?: string;
  styleTemplate?: string;
  userImageUrl?: string; // Primary image (for backward compatibility)
  userImageBase64?: string; // Base64 encoded image data (to avoid 403 on CloudFront URLs)
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
    // ========== PRE-FLIGHT VALIDATION ==========
    // Validate image data is available BEFORE creating any records
    const hasBase64 = input.userImageBase64 && input.userImageBase64.length > 100;
    const hasUrl = input.userImageUrl && input.userImageUrl.length > 0;
    
    if (!hasBase64 && !hasUrl) {
      console.error(`[Launch] PRE-FLIGHT FAILED: No image data available`);
      console.error(`[Launch] userImageBase64 length: ${input.userImageBase64?.length || 0}`);
      console.error(`[Launch] userImageUrl: ${input.userImageUrl || 'undefined'}`);
      throw new Error('IMAGE_DATA_MISSING: Character image is required. Please upload an image before starting generation.');
    }
    
    console.log(`[Launch] PRE-FLIGHT PASSED: hasBase64=${hasBase64}, hasUrl=${hasUrl}`);
    
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

    // ========== MODULE 0: ENHANCE DESCRIPTION (Haiku) ==========
    let enhancedDescription = input.description || "";
    
    // Only enhance if description is short (less than 200 characters)
    if (enhancedDescription.length > 0 && enhancedDescription.length < 200) {
      console.log(`[Launch] Starting ENHANCE_DESCRIPTION module (Haiku)...`);
      broadcastProgress(input.projectId, { 
        progress: 5, 
        message: "Enhancing project description with AI...",
        category: "analysis",
        level: "info",
        timestamp: new Date().toISOString()
      });
      
      try {
        enhancedDescription = await retryWithBackoff(
          async () => {
            return await enhanceDescription({
              projectName: input.name,
              ticker: input.ticker || "",
              description: input.description || "",
            });
          },
          {
            maxRetries: 2,
            initialDelayMs: 500,
            onRetry: (error, attempt) => {
              console.log(`[Launch] ENHANCE_DESCRIPTION retry ${attempt}/2: ${error.message}`);
            },
          }
        );
        console.log(`[Launch] Description enhanced: ${enhancedDescription.length} chars (was ${input.description?.length || 0} chars)`);
      } catch (error) {
        // If enhancement fails, continue with original description
        console.log(`[Launch] ENHANCE_DESCRIPTION failed, using original: ${(error as Error).message}`);
        enhancedDescription = input.description || "";
      }
    } else {
      console.log(`[Launch] Skipping ENHANCE_DESCRIPTION (description already detailed: ${enhancedDescription.length} chars)`);
    }

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
              description: enhancedDescription, // Use enhanced description
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
            
            // Get user logo buffer - prefer base64 data over URL download
            // CloudFront URLs from Manus Storage return 403 when accessed from server-side
            let logoBuffer: Buffer | undefined;
            
            // Option 1: Use base64 data if provided (most reliable)
            if (input.userImageBase64) {
              try {
                console.log(`[Launch] Using base64 data for user logo`);
                const base64WithoutPrefix = input.userImageBase64.replace(/^data:image\/\w+;base64,/, "");
                logoBuffer = Buffer.from(base64WithoutPrefix, "base64");
                console.log(`[Launch] Decoded user logo from base64, buffer size: ${logoBuffer.length}`);
              } catch (error) {
                console.warn(`[Launch] Error decoding base64 logo:`, error);
              }
            }
            
            // Option 2: Fallback to URL download (may fail with 403 on CloudFront URLs)
            if (!logoBuffer && userLogoUrl) {
              try {
                console.log(`[Launch] Attempting to download user logo from: ${userLogoUrl}`);
                const logoResponse = await fetch(userLogoUrl);
                if (logoResponse.ok) {
                  logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
                  console.log(`[Launch] Downloaded user logo, buffer size: ${logoBuffer.length}`);
                } else {
                  console.warn(`[Launch] Failed to download user logo: ${logoResponse.status} ${logoResponse.statusText}`);
                }
              } catch (error) {
                console.warn(`[Launch] Error downloading user logo:`, error);
              }
            }
            
            if (!logoBuffer) {
              console.error(`[Launch] CRITICAL: No logo buffer available - cannot proceed`);
              throw new Error('Logo image data is missing. Please ensure the character image is uploaded correctly.');
            }
            
            // Save logo asset to database (even without buffer, for URL reference)
            if (userLogoUrl) {
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

            // Process Feature Icon with remove.bg to ensure transparent background
            if (results.featureIcon?.buffer) {
              console.log('[Launch] Processing Feature Icon with remove.bg...');
              broadcastProgress(input.projectId, { 
                progress: 68, 
                message: 'Removing background from Feature Icon...',
                category: "images",
                level: "info",
                timestamp: new Date().toISOString()
              });
              
              const removeBgResult = await removeBackgroundWithFallback(results.featureIcon.buffer);
              results.featureIcon.buffer = removeBgResult.buffer;
              
              if (removeBgResult.backgroundRemoved) {
                console.log('[Launch] Feature Icon background removed successfully');
                broadcastProgress(input.projectId, { 
                  progress: 69, 
                  message: 'Feature Icon background removed',
                  category: "images",
                  level: "success",
                  timestamp: new Date().toISOString()
                });
              } else {
                console.log('[Launch] Feature Icon background removal failed, using original image');
                broadcastProgress(input.projectId, { 
                  progress: 69, 
                  message: 'Using original Feature Icon (background removal skipped)',
                  category: "images",
                  level: "warning",
                  timestamp: new Date().toISOString()
                });
              }
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
        // Analyze project for layout template selection
        let projectAnalysisResult: ProjectAnalysis | undefined;
        try {
          if (input.userImageUrl) {
            projectAnalysisResult = await analyzeProject(
              input.userImageUrl,
              input.name,
              input.ticker || '',
              input.description || ''
            );
            console.log(`[Launch] Project analysis: vibe=${projectAnalysisResult.vibe}, narrative=${projectAnalysisResult.narrativeType}, layout=${projectAnalysisResult.layoutStyle}`);
          }
        } catch (analysisError) {
          console.log(`[Launch] Project analysis failed, using default template: ${(analysisError as Error).message}`);
        }

        websiteHTML = await retryWithBackoff(
          async () => {
            return await generateWebsiteCode({
              projectName: input.name,
              ticker: input.ticker || "",
              description: input.description || "",
              contractAddress: project?.contractAddress || undefined,
              // Social links
              twitterUrl: input.twitterUrl,
              telegramUrl: input.telegramUrl,
              discordUrl: input.discordUrl,
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
              // Pass project analysis for template selection
              projectAnalysis: projectAnalysisResult ? {
                vibe: projectAnalysisResult.vibe,
                narrativeType: projectAnalysisResult.narrativeType,
                layoutStyle: projectAnalysisResult.layoutStyle,
              } : undefined,
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
        
        // Validate HTML structure before saving
        websiteHTML = validateAndFixHTML(websiteHTML);
        
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
        console.log(`[Launch] Uploading ${imageName} to R2 using buffer (${asset.buffer.length} bytes)...`);
        const result = await uploadBufferToR2(asset.buffer, subdomain, imageName);
        return result.url;
      } else if (asset.url) {
        // Fallback: download from URL (for resumed generations)
        // Note: CloudFront URLs from Manus Storage may return 403 from server-side
        console.log(`[Launch] Downloading ${imageName} from URL for R2 upload: ${asset.url}`);
        const response = await fetch(asset.url);
        if (!response.ok) {
          throw new Error(`Failed to download ${imageName}: ${response.status} ${response.statusText}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        console.log(`[Launch] Downloaded ${imageName}, buffer size: ${buffer.length}`);
        const result = await uploadBufferToR2(buffer, subdomain, imageName);
        return result.url;
      } else {
        throw new Error(`No buffer or URL available for ${imageName}`);
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


/**
 * Validate and fix common HTML structure issues
 * Specifically handles truncated or malformed button tags that can cause
 * JavaScript code to be displayed as text content
 */
function validateAndFixHTML(html: string): string {
  let fixedHTML = html;
  
  // Fix 1: Find unclosed button tags (button tag without closing >)
  // Pattern: <button followed by attributes but no > before next tag
  const unclosedButtonPattern = /<button\s+[^>]*(?=\s*<(?!\/button))/gi;
  fixedHTML = fixedHTML.replace(unclosedButtonPattern, (match) => {
    console.log(`[Launch] Fixed unclosed button tag: ${match.substring(0, 50)}...`);
    // Add closing > and default text
    return match + '>Copy</button><button';
  });
  
  // Fix 2: Find button tags that open but have no content before </button>
  // Pattern: <button ...></button> (empty button)
  const emptyButtonPattern = /<button([^>]*)><\/button>/gi;
  fixedHTML = fixedHTML.replace(emptyButtonPattern, (match, attrs) => {
    console.log(`[Launch] Fixed empty button tag`);
    return `<button${attrs}>Copy</button>`;
  });
  
  // Fix 3: Find button tags where <script> appears before </button>
  // This is the specific bug we encountered
  const scriptInButtonPattern = /<button([^>]*)>\s*<script>/gi;
  fixedHTML = fixedHTML.replace(scriptInButtonPattern, (match, attrs) => {
    console.log(`[Launch] Fixed button tag with script inside - critical fix applied`);
    return `<button${attrs}>Copy</button>\n    <script>`;
  });
  
  // Fix 4: Ensure all button tags are properly closed
  // Count opening and closing button tags
  const openingButtons = (fixedHTML.match(/<button/gi) || []).length;
  const closingButtons = (fixedHTML.match(/<\/button>/gi) || []).length;
  
  if (openingButtons !== closingButtons) {
    console.log(`[Launch] Warning: Button tag mismatch - ${openingButtons} opening, ${closingButtons} closing`);
    // Try to fix by finding button tags without proper closure
    fixedHTML = fixedHTML.replace(/<button([^>]*)>([^<]*?)(?=<(?!\/button))/gi, (match, attrs, content) => {
      if (!content.includes('</button>')) {
        console.log(`[Launch] Auto-closing button tag with content: ${content.substring(0, 20)}...`);
        return `<button${attrs}>${content || 'Copy'}</button>`;
      }
      return match;
    });
  }
  
  // Log if any fixes were applied
  if (fixedHTML !== html) {
    console.log(`[Launch] HTML validation: fixes were applied to ensure proper structure`);
  } else {
    console.log(`[Launch] HTML validation: structure looks good`);
  }
  
  return fixedHTML;
}
