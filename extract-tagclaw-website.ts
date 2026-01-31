import { getDb } from './server/db';
import { assets } from './drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { writeFileSync } from 'fs';

async function extractWebsite() {
  const db = await getDb();
  if (!db) {
    console.log('❌ Database not available');
    return;
  }
  
  const websiteAssets = await db.select().from(assets).where(
    and(
      eq(assets.projectId, 660003),
      eq(assets.assetType, 'website')
    )
  );
  
  if (websiteAssets.length === 0) {
    console.log('❌ No website asset found');
    return;
  }
  
  const websiteAsset = websiteAssets[0];
  console.log('✅ Found website asset (ID:', websiteAsset.id, ')');
  console.log('  Content length:', websiteAsset.textContent?.length || 0, 'chars');
  
  if (!websiteAsset.textContent) {
    console.log('❌ No HTML content');
    return;
  }
  
  // Save to public directory
  const htmlPath = '/home/ubuntu/ezcto/client/public/tagclaw-preview.html';
  writeFileSync(htmlPath, websiteAsset.textContent);
  console.log('\n📄 Website saved to:', htmlPath);
  console.log('\n🌐 Preview URL:');
  console.log('https://3000-ib0ia4h3yrjyr1ghm614r-c1067d99.sg1.manus.computer/tagclaw-preview.html');
}

extractWebsite();
