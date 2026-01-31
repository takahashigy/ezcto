import { getDb } from './server/db';
import { assets } from './drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { writeFileSync } from 'fs';

async function getWebsiteCode() {
  const db = await getDb();
  if (!db) {
    console.log('❌ Database not available');
    return;
  }
  
  const websiteAssets = await db.select().from(assets).where(
    and(
      eq(assets.projectId, 630006),
      eq(assets.assetType, 'website')
    )
  );
  
  if (websiteAssets.length === 0) {
    console.log('❌ No website asset found');
    return;
  }
  
  const websiteAsset = websiteAssets[0];
  console.log('✅ Found website asset');
  console.log('  Asset ID:', websiteAsset.id);
  console.log('  Text Content Length:', websiteAsset.textContent?.length || 0, 'chars');
  
  if (!websiteAsset.textContent) {
    console.log('❌ No HTML content found');
    return;
  }
  
  // Write to public directory for preview
  const htmlPath = '/home/ubuntu/ezcto/client/public/test-preview.html';
  writeFileSync(htmlPath, websiteAsset.textContent);
  console.log('\n📄 Website code saved to:', htmlPath);
  console.log('\n🌐 Preview URL: https://3000-ib0ia4h3yrjyr1ghm614r-c1067d99.sg1.manus.computer/test-preview.html');
}

getWebsiteCode();
