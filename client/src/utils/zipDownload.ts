import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Asset {
  type: string;
  url: string | null;
  textContent: string | null;
}

interface ProxyDownloadFn {
  (assetType: string): Promise<{ base64: string; contentType: string; filename: string }>;
}

/**
 * Download project assets as ZIP using proxy download to bypass CORS
 */
export async function downloadProjectAsZip(
  projectName: string, 
  assets: Asset[],
  proxyDownload?: ProxyDownloadFn
) {
  const zip = new JSZip();
  let filesAdded = 0;

  console.log('[ZipDownload] Starting download for:', projectName);
  console.log('[ZipDownload] Assets to process:', assets);

  // 添加文本资产
  for (const asset of assets) {
    if (asset.textContent) {
      const filename = `${asset.type}.txt`;
      zip.file(filename, asset.textContent);
      filesAdded++;
      console.log('[ZipDownload] Added text file:', filename);
    }
  }

  // 下载并添加图片资产
  for (const asset of assets) {
    if (asset.url && !asset.textContent) {
      try {
        let blob: Blob;
        let extension = 'png';

        // 优先使用代理下载（绕过 CORS）
        if (proxyDownload) {
          console.log('[ZipDownload] Using proxy download for:', asset.type);
          const result = await proxyDownload(asset.type);
          
          // 将 base64 转换为 Blob
          const binaryString = atob(result.base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blob = new Blob([bytes], { type: result.contentType });
          
          // 从 contentType 获取扩展名
          if (result.contentType.includes('png')) {
            extension = 'png';
          } else if (result.contentType.includes('jpeg') || result.contentType.includes('jpg')) {
            extension = 'jpg';
          } else if (result.contentType.includes('gif')) {
            extension = 'gif';
          } else if (result.contentType.includes('webp')) {
            extension = 'webp';
          }
        } else {
          // 降级：直接 fetch（可能因 CORS 失败）
          console.log('[ZipDownload] Direct fetch for:', asset.url);
          const response = await fetch(asset.url);
          if (!response.ok) {
            console.error(`[ZipDownload] Failed to fetch ${asset.type}: ${response.status}`);
            continue;
          }
          blob = await response.blob();
          extension = getExtensionFromUrl(asset.url);
        }

        const filename = `${asset.type}.${extension}`;
        zip.file(filename, blob);
        filesAdded++;
        console.log('[ZipDownload] Added file:', filename, 'size:', blob.size);
      } catch (error) {
        console.error(`[ZipDownload] Failed to download ${asset.type}:`, error);
      }
    }
  }

  console.log('[ZipDownload] Total files added:', filesAdded);

  if (filesAdded === 0) {
    console.warn('[ZipDownload] No files were added to the ZIP!');
    throw new Error('No files to download');
  }

  // 生成ZIP文件并下载
  const content = await zip.generateAsync({ type: 'blob' });
  const filename = `${projectName.toLowerCase().replace(/\s+/g, '-')}-assets.zip`;
  console.log('[ZipDownload] Saving ZIP:', filename, 'size:', content.size);
  saveAs(content, filename);
}

/**
 * Extract file extension from URL, handling query strings
 */
function getExtensionFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastDot = pathname.lastIndexOf('.');
    if (lastDot !== -1) {
      return pathname.substring(lastDot + 1);
    }
  } catch {
    // Fallback for relative URLs
    const cleanUrl = url.split('?')[0];
    const lastDot = cleanUrl.lastIndexOf('.');
    if (lastDot !== -1) {
      return cleanUrl.substring(lastDot + 1);
    }
  }
  return 'png';
}
