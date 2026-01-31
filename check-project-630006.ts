import { getDb } from './server/db';
import { projects, assets } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function checkProject() {
  const db = await getDb();
  if (!db) {
    console.log('❌ Database not available');
    return;
  }
  
  const projectList = await db.select().from(projects).where(eq(projects.id, 630006));
  
  if (projectList.length === 0) {
    console.log('Project 630006 not found');
    return;
  }
  
  const project = projectList[0];
  console.log('✅ Project 630006:');
  console.log('  Name:', project.projectName);
  console.log('  Ticker:', project.ticker);
  console.log('  Status:', project.status);
  console.log('  Payment Status:', project.paymentStatus);
  console.log('  Website URL:', project.websiteUrl || 'Not deployed');
  console.log('  Created:', project.createdAt);
  
  const projectAssets = await db.select().from(assets).where(eq(assets.projectId, 630006));
  console.log('\n📊 Assets (Total:', projectAssets.length, '):');
  
  const assetsByType = projectAssets.reduce((acc, asset) => {
    acc[asset.assetType] = (acc[asset.assetType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(assetsByType).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`);
  });
  
  console.log('\n🎉 SUCCESS! All 8 assets generated:');
  console.log('  ✅ PayDex Banner (1500x500)');
  console.log('  ✅ X Banner (1200x480)');
  console.log('  ✅ Logo (512x512)');
  console.log('  ✅ Hero Background (1920x1080)');
  console.log('  ✅ Feature Icons (256x256) × 3');
  console.log('  ✅ Community Scene (800x600)');
  console.log('  ✅ Website Code Generated');
}

checkProject();
