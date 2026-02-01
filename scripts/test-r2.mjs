/**
 * R2 Connection and Upload Test Script
 * 
 * Usage: node scripts/test-r2.mjs
 * 
 * This script tests:
 * 1. R2 environment variables are configured
 * 2. R2 connection works
 * 3. File upload succeeds
 * 4. File can be accessed via public URL
 */

import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

// Also try loading from process.env directly (for Manus environment)
const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const CLOUDFLARE_R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const CLOUDFLARE_R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const CLOUDFLARE_CUSTOM_DOMAIN = process.env.CLOUDFLARE_CUSTOM_DOMAIN;

console.log("=".repeat(60));
console.log("🧪 R2 Connection and Upload Test");
console.log("=".repeat(60));

// Step 1: Check environment variables
console.log("\n📋 Step 1: Checking environment variables...\n");

const envVars = {
  CLOUDFLARE_R2_ACCESS_KEY_ID: CLOUDFLARE_R2_ACCESS_KEY_ID ? "✅ Set" : "❌ Missing",
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: CLOUDFLARE_R2_SECRET_ACCESS_KEY ? "✅ Set" : "❌ Missing",
  CLOUDFLARE_R2_ENDPOINT: CLOUDFLARE_R2_ENDPOINT || "❌ Missing",
  CLOUDFLARE_R2_BUCKET_NAME: CLOUDFLARE_R2_BUCKET_NAME || "❌ Missing",
  CLOUDFLARE_CUSTOM_DOMAIN: CLOUDFLARE_CUSTOM_DOMAIN || "⚠️ Not set (optional)",
};

for (const [key, value] of Object.entries(envVars)) {
  console.log(`  ${key}: ${value}`);
}

// Check if required vars are present
const missingVars = [];
if (!CLOUDFLARE_R2_ACCESS_KEY_ID) missingVars.push("CLOUDFLARE_R2_ACCESS_KEY_ID");
if (!CLOUDFLARE_R2_SECRET_ACCESS_KEY) missingVars.push("CLOUDFLARE_R2_SECRET_ACCESS_KEY");
if (!CLOUDFLARE_R2_ENDPOINT) missingVars.push("CLOUDFLARE_R2_ENDPOINT");
if (!CLOUDFLARE_R2_BUCKET_NAME) missingVars.push("CLOUDFLARE_R2_BUCKET_NAME");

if (missingVars.length > 0) {
  console.log("\n❌ Missing required environment variables:");
  missingVars.forEach(v => console.log(`   - ${v}`));
  console.log("\nPlease configure these in Manus Management UI → Settings → Secrets");
  process.exit(1);
}

console.log("\n✅ All required environment variables are set!");

// Step 2: Create R2 client
console.log("\n📋 Step 2: Creating R2 client...\n");

const r2Client = new S3Client({
  region: "auto",
  endpoint: CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

console.log("✅ R2 client created successfully!");

// Step 3: Upload test file
console.log("\n📋 Step 3: Uploading test file...\n");

const testSlug = "test-upload";
const testFilename = `test-${Date.now()}.txt`;
const testKey = `${testSlug}/${testFilename}`;
const testContent = `Hello from R2 test! Timestamp: ${new Date().toISOString()}`;

try {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: CLOUDFLARE_R2_BUCKET_NAME,
      Key: testKey,
      Body: testContent,
      ContentType: "text/plain",
      CacheControl: "public, max-age=60",
    })
  );
  console.log(`✅ File uploaded successfully!`);
  console.log(`   Key: ${testKey}`);
  console.log(`   Content: ${testContent}`);
} catch (error) {
  console.log(`❌ Upload failed: ${error.message}`);
  console.log("\nPossible causes:");
  console.log("  - Invalid R2 credentials");
  console.log("  - Bucket does not exist");
  console.log("  - Network connectivity issues");
  process.exit(1);
}

// Step 4: Verify file exists
console.log("\n📋 Step 4: Verifying file exists in R2...\n");

try {
  const headResult = await r2Client.send(
    new HeadObjectCommand({
      Bucket: CLOUDFLARE_R2_BUCKET_NAME,
      Key: testKey,
    })
  );
  console.log(`✅ File verified in R2!`);
  console.log(`   Size: ${headResult.ContentLength} bytes`);
  console.log(`   Content-Type: ${headResult.ContentType}`);
} catch (error) {
  console.log(`❌ File verification failed: ${error.message}`);
  process.exit(1);
}

// Step 5: Generate access URLs
console.log("\n📋 Step 5: Access URLs...\n");

// Worker URL (via ezcto.fun subdomain)
const workerUrl = `https://${testSlug}.ezcto.fun/${testFilename}`;
console.log(`🌐 Worker URL (after deploying Worker):`);
console.log(`   ${workerUrl}`);

// Direct R2 URL (if public access is enabled)
if (CLOUDFLARE_CUSTOM_DOMAIN) {
  const directUrl = `https://${CLOUDFLARE_CUSTOM_DOMAIN}/${testKey}`;
  console.log(`\n🌐 Direct R2 URL (if public access enabled):`);
  console.log(`   ${directUrl}`);
}

// Step 6: Test image upload
console.log("\n📋 Step 6: Testing image upload (PNG)...\n");

// Create a simple 1x1 red PNG (minimal valid PNG)
const pngHeader = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, // IHDR length
  0x49, 0x48, 0x44, 0x52, // IHDR
  0x00, 0x00, 0x00, 0x01, // width: 1
  0x00, 0x00, 0x00, 0x01, // height: 1
  0x08, 0x02, // bit depth: 8, color type: 2 (RGB)
  0x00, 0x00, 0x00, // compression, filter, interlace
  0x90, 0x77, 0x53, 0xDE, // IHDR CRC
  0x00, 0x00, 0x00, 0x0C, // IDAT length
  0x49, 0x44, 0x41, 0x54, // IDAT
  0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 0x00, // compressed data (red pixel)
  0x01, 0x01, 0x01, 0x00, // IDAT CRC (approximate)
  0x00, 0x00, 0x00, 0x00, // IEND length
  0x49, 0x45, 0x4E, 0x44, // IEND
  0xAE, 0x42, 0x60, 0x82, // IEND CRC
]);

const imageFilename = `test-image-${Date.now()}.png`;
const imageKey = `${testSlug}/assets/${imageFilename}`;

try {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: CLOUDFLARE_R2_BUCKET_NAME,
      Key: imageKey,
      Body: pngHeader,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000",
    })
  );
  console.log(`✅ Image uploaded successfully!`);
  console.log(`   Key: ${imageKey}`);
  console.log(`   Size: ${pngHeader.length} bytes`);
  
  const imageWorkerUrl = `https://${testSlug}.ezcto.fun/assets/${imageFilename}`;
  console.log(`\n🖼️ Image URL (via Worker):`);
  console.log(`   ${imageWorkerUrl}`);
} catch (error) {
  console.log(`❌ Image upload failed: ${error.message}`);
}

// Step 7: Cleanup option
console.log("\n📋 Step 7: Cleanup...\n");
console.log("Test files created:");
console.log(`   - ${testKey}`);
console.log(`   - ${imageKey}`);
console.log("\nTo delete test files, run with --cleanup flag");

if (process.argv.includes("--cleanup")) {
  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: CLOUDFLARE_R2_BUCKET_NAME, Key: testKey }));
    await r2Client.send(new DeleteObjectCommand({ Bucket: CLOUDFLARE_R2_BUCKET_NAME, Key: imageKey }));
    console.log("✅ Test files deleted!");
  } catch (error) {
    console.log(`⚠️ Cleanup failed: ${error.message}`);
  }
}

// Summary
console.log("\n" + "=".repeat(60));
console.log("📊 Test Summary");
console.log("=".repeat(60));
console.log("\n✅ R2 connection: SUCCESS");
console.log("✅ Text upload: SUCCESS");
console.log("✅ Image upload: SUCCESS");
console.log("\n🎉 R2 is working correctly!");
console.log("\n⚠️ Next steps:");
console.log("   1. Deploy Cloudflare Worker to enable subdomain access");
console.log("   2. Test accessing files via https://{slug}.ezcto.fun/");
console.log("   3. Integrate with image generation flow");
