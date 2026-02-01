/**
 * Image download and R2 upload utilities
 * Downloads AI-generated images and uploads them to R2 for deployment
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const CLOUDFLARE_R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const CLOUDFLARE_R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;

if (!CLOUDFLARE_R2_ACCESS_KEY_ID || !CLOUDFLARE_R2_SECRET_ACCESS_KEY || !CLOUDFLARE_R2_ENDPOINT || !CLOUDFLARE_R2_BUCKET_NAME) {
  console.warn("[ImageUpload] Cloudflare R2 credentials not configured");
}

const r2Client = new S3Client({
  region: "auto",
  endpoint: CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID || "",
    secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
  },
});

export interface ImageUploadResult {
  url: string; // Relative URL for HTML: /assets/xxx.png
  r2Key: string; // Full R2 key: {slug}/assets/xxx.png
  filename: string; // Just the filename: xxx.png
}

/**
 * Download image from URL and return as Buffer
 */
async function downloadImage(imageUrl: string): Promise<Buffer> {
  console.log(`[ImageUpload] Downloading image from: ${imageUrl}`);
  
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate a unique filename with hash to prevent collisions
 */
function generateFilename(originalName: string, buffer: Buffer): string {
  const ext = originalName.split('.').pop() || 'png';
  const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8);
  const baseName = originalName.replace(/\.[^/.]+$/, ''); // Remove extension
  return `${baseName}-${hash}.${ext}`;
}

/**
 * Upload image buffer to R2
 */
async function uploadToR2(
  slug: string,
  filename: string,
  buffer: Buffer,
  contentType: string = 'image/png'
): Promise<string> {
  const r2Key = `${slug}/assets/${filename}`;
  
  console.log(`[ImageUpload] Uploading to R2: ${r2Key}`);
  
  await r2Client.send(
    new PutObjectCommand({
      Bucket: CLOUDFLARE_R2_BUCKET_NAME,
      Key: r2Key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000", // 1 year cache for images
    })
  );
  
  return r2Key;
}

/**
 * Download image from URL and upload to R2
 * Returns relative URL for use in HTML
 */
export async function downloadAndUploadImage(
  imageUrl: string,
  slug: string,
  imageName: string
): Promise<ImageUploadResult> {
  try {
    // Download image
    const buffer = await downloadImage(imageUrl);
    
    // Generate unique filename
    const filename = generateFilename(imageName, buffer);
    
    // Determine content type from extension
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
      : ext === 'gif' ? 'image/gif'
      : ext === 'webp' ? 'image/webp'
      : 'image/png';
    
    // Upload to R2
    const r2Key = await uploadToR2(slug, filename, buffer, contentType);
    
    // Return relative URL (for HTML) and full R2 key
    return {
      url: `/assets/${filename}`, // Relative URL for HTML
      r2Key, // Full R2 key for reference
      filename,
    };
  } catch (error) {
    console.error(`[ImageUpload] Failed to process image ${imageName}:`, error);
    throw new Error(`Failed to upload image ${imageName}: ${(error as Error).message}`);
  }
}

/**
 * Upload image buffer directly to R2 (no download needed)
 * Use this when you already have the image buffer from generateImage()
 */
export async function uploadBufferToR2(
  buffer: Buffer,
  slug: string,
  imageName: string
): Promise<ImageUploadResult> {
  try {
    // Generate unique filename
    const filename = generateFilename(imageName, buffer);
    
    // Determine content type from extension
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
      : ext === 'gif' ? 'image/gif'
      : ext === 'webp' ? 'image/webp'
      : 'image/png';
    
    // Upload to R2
    const r2Key = await uploadToR2(slug, filename, buffer, contentType);
    
    console.log(`[ImageUpload] Buffer uploaded to R2: ${r2Key}`);
    
    // Return relative URL (for HTML) and full R2 key
    return {
      url: `/assets/${filename}`, // Relative URL for HTML
      r2Key, // Full R2 key for reference
      filename,
    };
  } catch (error) {
    console.error(`[ImageUpload] Failed to upload buffer ${imageName}:`, error);
    throw new Error(`Failed to upload buffer ${imageName}: ${(error as Error).message}`);
  }
}

/**
 * Batch upload multiple image buffers directly to R2
 * Use this when you have buffers from generateImage()
 */
export async function uploadBufferBatch(
  images: Array<{ buffer: Buffer; name: string }>,
  slug: string
): Promise<Record<string, ImageUploadResult>> {
  console.log(`[ImageUpload] Uploading batch of ${images.length} buffers for slug: ${slug}`);
  
  const results: Record<string, ImageUploadResult> = {};
  
  // Upload images sequentially to avoid overwhelming the API
  for (const image of images) {
    const result = await uploadBufferToR2(image.buffer, slug, image.name);
    results[image.name] = result;
  }
  
  console.log(`[ImageUpload] Buffer batch upload complete. Uploaded ${Object.keys(results).length} images.`);
  
  return results;
}

/**
 * Batch upload multiple images (legacy - downloads from URL)
 * @deprecated Use uploadBufferBatch instead when you have buffers
 */
export async function uploadImageBatch(
  images: Array<{ url: string; name: string }>,
  slug: string
): Promise<Record<string, ImageUploadResult>> {
  console.log(`[ImageUpload] Uploading batch of ${images.length} images for slug: ${slug}`);
  
  const results: Record<string, ImageUploadResult> = {};
  
  // Upload images sequentially to avoid overwhelming the API
  for (const image of images) {
    const result = await downloadAndUploadImage(image.url, slug, image.name);
    results[image.name] = result;
  }
  
  console.log(`[ImageUpload] Batch upload complete. Uploaded ${Object.keys(results).length} images.`);
  
  return results;
}
