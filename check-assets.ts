import { getDb } from './server/db';
import { assets } from './drizzle/schema';
import { eq, desc } from 'drizzle-orm';

async function checkAssets() {
  const db = await getDb();
  if (!db) {
    console.log('❌ Database not available');
    return;
  }
  
  // Get all assets for project 660003
  const projectAssets = await db.select().from(assets)
    .where(eq(assets.projectId, 660003))
    .orderBy(desc(assets.createdAt));
  
  console.log(`Found ${projectAssets.length} assets for project 660003:\n`);
  
  for (const asset of projectAssets) {
    console.log(`Asset ID: ${asset.id}`);
    console.log(`  Type: ${asset.assetType}`);
    console.log(`  File URL: ${asset.fileUrl || 'N/A'}`);
    console.log(`  Text Content: ${asset.textContent ? `${asset.textContent.length} chars` : 'N/A'}`);
    console.log();
  }
}

checkAssets();
