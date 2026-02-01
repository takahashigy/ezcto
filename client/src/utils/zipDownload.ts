import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Asset {
  type: string;
  url: string | null;
  textContent: string | null;
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

export async function downloadProjectAsZip(projectName: string, assets: Asset[]) {
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
        console.log('[ZipDownload] Fetching:', asset.url);
        const response = await fetch(asset.url);
        if (!response.ok) {
          console.error(`[ZipDownload] Failed to fetch ${asset.type}: ${response.status}`);
          continue;
        }
        const blob = await response.blob();
        const extension = getExtensionFromUrl(asset.url);
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
