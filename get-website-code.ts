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
  console.log('  URL:', websiteAsset.assetUrl);
  
  // Write to file for preview
  const htmlPath = '/home/ubuntu/ezcto/test-website-preview.html';
  writeFileSync(htmlPath, websiteAsset.assetUrl || '');
  console.log('\n📄 Website code saved to:', htmlPath);
  console.log('\nYou can preview it at: https://3000-ib0ia4h3yrjyr1ghm614r-c1067d99.sg1.manus.computer/test-website-preview.html');
}

getWebsiteCode();
