import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Asset {
  type: string;
  url: string | null;
  textContent: string | null;
}

export async function downloadProjectAsZip(projectName: string, assets: Asset[]) {
  const zip = new JSZip();

  // 添加文本资产
  for (const asset of assets) {
    if (asset.textContent) {
      const filename = `${asset.type}.txt`;
      zip.file(filename, asset.textContent);
    }
  }

  // 下载并添加图片资产
  for (const asset of assets) {
    if (asset.url && !asset.textContent) {
      try {
        const response = await fetch(asset.url);
        const blob = await response.blob();
        const extension = asset.url.split('.').pop() || 'png';
        const filename = `${asset.type}.${extension}`;
        zip.file(filename, blob);
      } catch (error) {
        console.error(`Failed to download ${asset.type}:`, error);
      }
    }
  }

  // 生成ZIP文件并下载
  const content = await zip.generateAsync({ type: 'blob' });
  const filename = `${projectName.toLowerCase().replace(/\s+/g, '-')}-assets.zip`;
  saveAs(content, filename);
}
