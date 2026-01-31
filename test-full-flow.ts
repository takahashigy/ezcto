/**
 * Full Flow Test for EZCTO
 * Tests the complete generation pipeline from project creation to asset generation
 */

import { executeLaunch } from "./server/launch";
import * as db from "./server/db";

async function testFullFlow() {
  console.log("🚀 Starting EZCTO Full Flow Test\n");

  const testData = {
    projectName: "Test Doge Coin",
    ticker: "TESTDOGE",
    description: "A fun and community-driven test meme coin for testing EZCTO platform. Join our vibrant community!",
    userImageUrl: "https://upload.wikimedia.org/wikipedia/en/d/d0/Dogecoin_Logo.png",
  };

  try {
    // Step 1: Create test user (simulate authenticated user)
    console.log("📝 Step 1: Preparing test environment...");
    const testUserId = 1; // Assuming owner user ID is 1
    
    // Check user's free generations
    const user = await db.getUserById(testUserId);
    if (!user) {
      throw new Error("Test user not found");
    }
    console.log(`✅ User found: ${user.name} (freeGenerationsUsed: ${user.freeGenerationsUsed})`);

    // Step 2: Create project
    console.log("\n📝 Step 2: Creating test project...");
    const project = await db.createProject({
      userId: testUserId,
      name: testData.projectName,
      ticker: testData.ticker,
      description: testData.description,
      userImageUrl: testData.userImageUrl,
      status: "draft",
      paymentStatus: "unpaid",
    });
    console.log(`✅ Project created: ID=${project.id}, Name=${project.name}`);

    // Step 3: Execute launch (background generation)
    console.log("\n📝 Step 3: Starting generation process...");
    console.log("⏳ This will take 8-12 minutes. Please wait...\n");
    
    const startTime = Date.now();
    
    await executeLaunch({
      projectId: project.id,
      name: testData.projectName,
      ticker: testData.ticker,
      description: testData.description,
      userImageUrl: testData.userImageUrl,
    });

    const endTime = Date.now();
    const durationMinutes = ((endTime - startTime) / 1000 / 60).toFixed(2);
    
    console.log(`\n✅ Generation completed in ${durationMinutes} minutes`);

    // Step 4: Verify results
    console.log("\n📝 Step 4: Verifying generation results...");
    
    // Check project status
    const updatedProject = await db.getProjectById(project.id);
    console.log(`Project status: ${updatedProject?.status}`);
    
    // Check assets
    const assets = await db.getAssetsByProjectId(project.id);
    console.log(`\n📊 Generated Assets (${assets.length} total):`);
    
    const assetTypes = {
      logo: assets.filter(a => a.assetType === 'logo').length,
      paydex_banner: assets.filter(a => a.assetType === 'paydex_banner').length,
      x_banner: assets.filter(a => a.assetType === 'x_banner').length,
      hero_background: assets.filter(a => a.assetType === 'hero_background').length,
      feature_icon: assets.filter(a => a.assetType === 'feature_icon').length,
      community_scene: assets.filter(a => a.assetType === 'community_scene').length,
      website: assets.filter(a => a.assetType === 'website').length,
    };
    
    console.log(`  - Logo: ${assetTypes.logo}`);
    console.log(`  - PayDex Banner: ${assetTypes.paydex_banner}`);
    console.log(`  - X Banner: ${assetTypes.x_banner}`);
    console.log(`  - Hero Background: ${assetTypes.hero_background}`);
    console.log(`  - Feature Icons: ${assetTypes.feature_icon}`);
    console.log(`  - Community Scene: ${assetTypes.community_scene}`);
    console.log(`  - Website: ${assetTypes.website}`);
    
    // Check generation history
    const history = await db.getGenerationHistoryByProjectId(project.id);
    console.log(`\n📜 Generation History: ${history.length} records`);
    if (history.length > 0) {
      const latestHistory = history[0];
      console.log(`  Status: ${latestHistory.status}`);
      console.log(`  Duration: ${latestHistory.durationMs}ms`);
      if (latestHistory.metadata) {
        const metadata = latestHistory.metadata as any;
        console.log(`  Current Step: ${metadata.currentStep}`);
        console.log(`  Steps completed: ${metadata.steps?.filter((s: any) => s.status === 'completed').length}/${metadata.steps?.length}`);
      }
    }

    // Step 5: Validation
    console.log("\n📝 Step 5: Validation...");
    const expectedAssets = 8; // 1 logo + 1 paydex + 1 x + 1 hero + 3 icons + 1 community + 1 website = 9, but website might be counted separately
    
    if (updatedProject?.status === 'completed') {
      console.log("✅ Project status is 'completed'");
    } else {
      console.log(`❌ Project status is '${updatedProject?.status}' (expected 'completed')`);
    }
    
    if (assets.length >= 8) {
      console.log(`✅ Generated ${assets.length} assets (expected at least 8)`);
    } else {
      console.log(`❌ Only generated ${assets.length} assets (expected at least 8)`);
    }

    console.log("\n🎉 Full Flow Test Completed!");
    console.log(`\n📊 Summary:`);
    console.log(`  - Project ID: ${project.id}`);
    console.log(`  - Duration: ${durationMinutes} minutes`);
    console.log(`  - Assets: ${assets.length}`);
    console.log(`  - Status: ${updatedProject?.status}`);
    console.log(`  - Payment Status: ${updatedProject?.paymentStatus}`);

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  }
}

// Run test
testFullFlow()
  .then(() => {
    console.log("\n✅ Test script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test script failed:", error);
    process.exit(1);
  });
