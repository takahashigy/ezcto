/**
 * remove.bg API 集成模块
 * 用于移除图片背景，生成透明 PNG
 */

const REMOVE_BG_API_URL = 'https://api.remove.bg/v1.0/removebg';

interface RemoveBgOptions {
  /** 图片 Buffer */
  imageBuffer: Buffer;
  /** 输出图片大小，默认 'auto' */
  size?: 'preview' | 'small' | 'regular' | 'medium' | 'hd' | '4k' | 'auto';
  /** 输出格式，默认 'png' */
  format?: 'png' | 'jpg' | 'zip';
  /** 背景颜色（可选，不设置则为透明） */
  bgColor?: string;
}

interface RemoveBgResult {
  success: boolean;
  /** 去背景后的图片 Buffer */
  buffer?: Buffer;
  /** 错误信息 */
  error?: string;
}

/**
 * 调用 remove.bg API 移除图片背景
 * @param options 配置选项
 * @returns 去背景后的图片 Buffer 或错误信息
 */
export async function removeBackground(options: RemoveBgOptions): Promise<RemoveBgResult> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  
  if (!apiKey) {
    console.error('[remove.bg] API key not configured');
    return { success: false, error: 'REMOVE_BG_API_KEY not configured' };
  }

  try {
    const formData = new FormData();
    
    // 将 Buffer 转换为 Blob
    const uint8Array = new Uint8Array(options.imageBuffer);
    const blob = new Blob([uint8Array], { type: 'image/png' });
    formData.append('image_file', blob, 'image.png');
    formData.append('size', options.size || 'auto');
    formData.append('format', options.format || 'png');
    
    if (options.bgColor) {
      formData.append('bg_color', options.bgColor);
    }

    console.log('[remove.bg] Sending request to remove background...');
    const startTime = Date.now();

    const response = await fetch(REMOVE_BG_API_URL, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: formData,
    });

    const duration = Date.now() - startTime;
    console.log(`[remove.bg] Response received in ${duration}ms, status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[remove.bg] API error:', response.status, errorText);
      return { 
        success: false, 
        error: `remove.bg API error: ${response.status} - ${errorText}` 
      };
    }

    // 获取返回的图片数据
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[remove.bg] Successfully removed background, output size: ${buffer.length} bytes`);

    return {
      success: true,
      buffer,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[remove.bg] Request failed:', errorMessage);
    return { 
      success: false, 
      error: `remove.bg request failed: ${errorMessage}` 
    };
  }
}

/**
 * 移除图片背景（带降级处理）
 * 如果 remove.bg 失败，返回原始图片
 * @param imageBuffer 原始图片 Buffer
 * @returns 去背景后的图片 Buffer（或失败时返回原图）
 */
export async function removeBackgroundWithFallback(imageBuffer: Buffer): Promise<{
  buffer: Buffer;
  backgroundRemoved: boolean;
}> {
  const result = await removeBackground({ imageBuffer });
  
  if (result.success && result.buffer) {
    return {
      buffer: result.buffer,
      backgroundRemoved: true,
    };
  }
  
  console.warn('[remove.bg] Failed to remove background, using original image:', result.error);
  return {
    buffer: imageBuffer,
    backgroundRemoved: false,
  };
}
