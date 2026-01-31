/**
 * Subdomain deployment module with KV validation
 * Deploys generated website to Cloudflare R2 with custom subdomain
 * Uses Cloudflare KV to track slug availability
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const CLOUDFLARE_R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const CLOUDFLARE_R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_R2_ACCESS_KEY_ID_FOR_KV = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID; // Reuse for KV API auth

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

// KV Namespace ID (you need to get this from Cloudflare Dashboard)
const KV_NAMESPACE_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID || "YOUR_KV_NAMESPACE_ID";

export interface DeploymentResult {
  subdomain: string;
  deploymentUrl: string;
  success: boolean;
  error?: string;
}

export interface SlugCheckResult {
  available: boolean;
  slug: string;
  message?: string;
}

/**
 * Check if slug is available in KV
 * Uses Cloudflare KV REST API
 */
export async function checkSlugAvailability(slug: string): Promise<SlugCheckResult> {
  try {
    console.log(`[Deployment] Checking slug availability: ${slug}`);
    
    // Validate slug format
    if (!isValidSlug(slug)) {
      return {
        available: false,
        slug,
        message: "Invalid slug format. Use only lowercase letters, numbers, and hyphens (3-63 characters).",
      };
    }
    
    // Check KV via REST API
    // Note: This requires Cloudflare API token with KV read permissions
    // For now, we'll use a simple HTTP request approach
    
    // Alternative: Use Cloudflare API token
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    if (!apiToken || !CLOUDFLARE_ACCOUNT_ID) {
      console.warn("[Deployment] Cloudflare API token not configured, skipping KV check");
      return { available: true, slug };
    }
    
    const kvKey = `slug:${slug}`;
    const kvUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${kvKey}`;
    
    const response = await fetch(kvUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });
    
    if (response.status === 404) {
      // Key not found = slug available
      return { available: true, slug };
    } else if (response.ok) {
      // Key exists = slug taken
      return {
        available: false,
        slug,
        message: "This subdomain is already taken. Please choose another one.",
      };
    } else {
      console.error(`[Deployment] KV check failed: ${response.statusText}`);
      // On error, allow deployment (fail open)
      return { available: true, slug };
    }
  } catch (error) {
    console.error(`[Deployment] Error checking slug availability:`, error);
    // On error, allow deployment (fail open)
    return { available: true, slug };
  }
}

/**
 * Reserve slug in KV (write slug:slug mapping)
 */
async function reserveSlug(slug: string): Promise<void> {
  try {
    console.log(`[Deployment] Reserving slug in KV: ${slug}`);
    
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    if (!apiToken || !CLOUDFLARE_ACCOUNT_ID) {
      console.warn("[Deployment] Cloudflare API token not configured, skipping KV write");
      return;
    }
    
    const kvKey = `slug:${slug}`;
    const kvUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${kvKey}`;
    
    const response = await fetch(kvUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'text/plain',
      },
      body: slug, // Value is just the slug itself
    });
    
    if (!response.ok) {
      console.error(`[Deployment] Failed to reserve slug in KV: ${response.statusText}`);
    } else {
      console.log(`[Deployment] Successfully reserved slug: ${slug}`);
    }
  } catch (error) {
    console.error(`[Deployment] Error reserving slug:`, error);
    // Don't throw - deployment can continue even if KV write fails
  }
}

/**
 * Validate slug format
 */
function isValidSlug(slug: string): boolean {
  // Must be 3-63 characters, lowercase letters, numbers, and hyphens only
  // Cannot start or end with hyphen
  const slugRegex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
  return slugRegex.test(slug);
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
 * Deploy website HTML and assets to Cloudflare R2 with custom subdomain
 * Checks KV for slug availability and reserves it
 */
export async function deployWebsite(
  projectId: number,
  subdomain: string,
  htmlContent: string
): Promise<DeploymentResult> {
  try {
    console.log(`[Deployment] Deploying project ${projectId} to subdomain: ${subdomain}`);
    
    // Check slug availability
    const slugCheck = await checkSlugAvailability(subdomain);
    if (!slugCheck.available) {
      return {
        subdomain,
        deploymentUrl: "",
        success: false,
        error: slugCheck.message || "Subdomain is not available",
      };
    }
    
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
    
    // Reserve slug in KV
    await reserveSlug(subdomain);
    
    // Construct deployment URL using custom subdomain
    const deploymentUrl = `https://${subdomain}.ezcto.fun`;
    
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
    
    const deploymentUrl = `https://${subdomain}.ezcto.fun`;
    
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
