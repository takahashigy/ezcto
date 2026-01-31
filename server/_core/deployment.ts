/**
 * Subdomain deployment module
 * Deploys generated website HTML to Cloudflare R2 with custom subdomain
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const CLOUDFLARE_R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const CLOUDFLARE_R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const CLOUDFLARE_CUSTOM_DOMAIN = process.env.CLOUDFLARE_CUSTOM_DOMAIN || "ezcto.fun";

if (!CLOUDFLARE_R2_ACCESS_KEY_ID || !CLOUDFLARE_R2_SECRET_ACCESS_KEY || !CLOUDFLARE_R2_ENDPOINT || !CLOUDFLARE_R2_BUCKET_NAME) {
  console.warn("[Deployment] Cloudflare R2 credentials not configured");
}

const r2Client = new S3Client({
  region: "auto",
  endpoint: CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID || "",
    secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
  },
});

export interface DeploymentResult {
  subdomain: string;
  deploymentUrl: string;
  success: boolean;
  error?: string;
}

/**
 * Generate a unique subdomain from project name and ticker
 */
export function generateSubdomain(projectName: string, ticker?: string): string {
  // Use ticker if available, otherwise use project name
  const base = ticker || projectName;
  
  // Convert to lowercase, remove special characters, replace spaces with hyphens
  let subdomain = base
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .trim();
  
  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  
  // Ensure subdomain has valid base (at least 1 character)
  if (subdomain.length === 0) {
    subdomain = `site-${randomSuffix}`;
  } else {
    subdomain = `${subdomain}-${randomSuffix}`;
  }
  
  // Ensure subdomain is valid (3-63 characters)
  if (subdomain.length < 3) {
    subdomain = `site-${randomSuffix}`;
  }
  if (subdomain.length > 63) {
    // Truncate base to fit within limit
    const maxBaseLength = 63 - randomSuffix.length - 1; // -1 for hyphen
    const truncatedBase = subdomain.substring(0, maxBaseLength);
    subdomain = `${truncatedBase}-${randomSuffix}`;
  }
  
  return subdomain;
}

/**
 * Deploy website HTML to Cloudflare R2 with custom subdomain
 */
export async function deployWebsite(
  projectId: number,
  subdomain: string,
  htmlContent: string
): Promise<DeploymentResult> {
  try {
    console.log(`[Deployment] Deploying project ${projectId} to subdomain: ${subdomain}`);
    
    // Upload index.html to R2
    const key = `${subdomain}/index.html`;
    
    await r2Client.send(
      new PutObjectCommand({
        Bucket: CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
        Body: htmlContent,
        ContentType: "text/html; charset=utf-8",
        CacheControl: "public, max-age=3600"
      })
    );
    
    // Construct deployment URL using custom domain
    const deploymentUrl = `https://${subdomain}.${CLOUDFLARE_CUSTOM_DOMAIN}`;
    
    console.log(`[Deployment] Successfully deployed to ${deploymentUrl}`);
    
    return {
      subdomain,
      deploymentUrl,
      success: true,
    };
  } catch (error) {
    console.error(`[Deployment] Failed to deploy project ${projectId}:`, error);
    return {
      subdomain,
      deploymentUrl: "",
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Update deployment (re-deploy with new content)
 */
export async function updateDeployment(
  subdomain: string,
  htmlContent: string
): Promise<DeploymentResult> {
  try {
    console.log(`[Deployment] Updating deployment for subdomain: ${subdomain}`);
    
    const key = `${subdomain}/index.html`;
    
    await r2Client.send(
      new PutObjectCommand({
        Bucket: CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
        Body: htmlContent,
        ContentType: "text/html; charset=utf-8",
        CacheControl: "public, max-age=3600"
      })
    );
    
    const deploymentUrl = `https://${subdomain}.${CLOUDFLARE_CUSTOM_DOMAIN}`;
    
    console.log(`[Deployment] Successfully updated deployment at ${deploymentUrl}`);
    
    return {
      subdomain,
      deploymentUrl,
      success: true,
    };
  } catch (error) {
    console.error(`[Deployment] Failed to update deployment for ${subdomain}:`, error);
    return {
      subdomain,
      deploymentUrl: "",
      success: false,
      error: (error as Error).message,
    };
  }
}
