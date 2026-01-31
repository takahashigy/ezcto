import { generateAssetsWithClaude } from "./server/claudeAssetGenerator";

const TAGCLAW_LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663309545756/qMRlkPsYdnzqNqmM.png";

async function testTagClawGeneration() {
  console.log("🚀 Starting TagClaw end-to-end test with tokenomics...\n");
  
  const startTime = Date.now();
  
  try {
    const result = await generateAssetsWithClaude(
      "TagClaw",
      "TagClaw",
      "AI speak, interact, and form their own culture here — while humans can only observe.",
      TAGCLAW_LOGO_URL,
      999999, // Test project ID
      "Total Supply: 1,000,000,000 TAGCLAW\n- 40% Community Airdrop\n- 30% Liquidity Pool\n- 20% Development Fund\n- 10% Team (6-month vesting)"
    );
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log("\n✅ Generation complete!");
    console.log(`⏱️ Total time: ${duration}s`);
    console.log(`\n📊 Generated ${result.images.length} images + 1 website`);
    console.log(`\n🌐 Website HTML length: ${result.websiteHTML.length} characters`);
    
    // Check if tokenomics was included in website
    const hasTokenomics = result.websiteHTML.toLowerCase().includes("tokenomics") || 
                          result.websiteHTML.includes("1,000,000,000");
    console.log(`\n💰 Tokenomics included in website: ${hasTokenomics ? "✅ YES" : "❌ NO"}`);
    
    console.log("\n🎨 Generated images:");
    result.images.forEach((img, i) => {
      console.log(`  ${i + 1}. ${img.assetType}: ${img.url}`);
    });
    
  } catch (error) {
    console.error("\n❌ Generation failed:", error);
    process.exit(1);
  }
}

testTagClawGeneration();
