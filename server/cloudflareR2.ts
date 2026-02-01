import { S3Client, PutObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

// R2 is S3-compatible, so we use AWS SDK
const r2Client = new S3Client({
  region: "auto", // R2 uses "auto" as region
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const customDomain = process.env.CLOUDFLARE_CUSTOM_DOMAIN!;

/**
 * Upload HTML content to R2
 * @param subdomain - The subdomain (e.g., "dogeking")
 * @param htmlContent - The HTML content to upload
 * @returns The public URL of the uploaded file
 */
export async function uploadToR2(subdomain: string, htmlContent: string): Promise<string> {
  // Use same path format as deployment.ts: {subdomain}/index.html (not sites/{subdomain}/index.html)
  const key = `${subdomain}/index.html`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: htmlContent,
    ContentType: "text/html; charset=utf-8",
    CacheControl: "public, max-age=3600",
  });

  await r2Client.send(command);

  // Return the public URL (accessed via Cloudflare Worker)
  return `https://${subdomain}.${customDomain}`;
}

/**
 * Upload HTML content to R2 for preview (temporary path)
 * @param projectId - The project ID
 * @param htmlContent - The HTML content to upload
 * @returns The preview URL
 */
export async function uploadPreviewToR2(projectId: number, htmlContent: string): Promise<string> {
  // Use a preview-specific path with timestamp for uniqueness
  const timestamp = Date.now();
  const key = `preview/${projectId}-${timestamp}/index.html`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: htmlContent,
    ContentType: "text/html; charset=utf-8",
    CacheControl: "no-cache, no-store, must-revalidate", // No caching for preview
  });

  await r2Client.send(command);

  // Return the preview URL using assets domain
  // Preview files are accessed via: https://assets.ezcto.fun/preview/{projectId}-{timestamp}/index.html
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || `https://assets.${customDomain}`;
  return `${publicUrl}/preview/${projectId}-${timestamp}/index.html`;
}

/**
 * Test R2 connection by checking if bucket exists
 * @returns true if connection is successful
 */
export async function testR2Connection(): Promise<boolean> {
  try {
    const command = new HeadBucketCommand({
      Bucket: bucketName,
    });
    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error("[R2] Connection test failed:", error);
    return false;
  }
}
