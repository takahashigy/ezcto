import { getDb } from './server/db';
import { projects, assets } from './drizzle/schema';
import { desc, eq } from 'drizzle-orm';

async function checkLatestProject() {
  const db = await getDb();
  if (!db) {
    console.log('❌ Database not available');
    return;
  }
  
  const latestProjects = await db.select().from(projects).orderBy(desc(projects.id)).limit(1);
  
  if (latestProjects.length === 0) {
    console.log('No projects found');
    return;
  }
  
  const project = latestProjects[0];
  console.log('✅ Latest Project:');
  console.log('  ID:', project.id);
  console.log('  Name:', project.projectName);
  console.log('  Status:', project.status);
  console.log('  Payment Status:', project.paymentStatus);
  console.log('  Created:', project.createdAt);
  
  const projectAssets = await db.select().from(assets).where(eq(assets.projectId, project.id));
  console.log('\n📊 Assets:');
  console.log('  Total Count:', projectAssets.length);
  
  const assetsByType = projectAssets.reduce((acc, asset) => {
    acc[asset.assetType] = (acc[asset.assetType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(assetsByType).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`);
  });
  
  if (project.websiteUrl) {
    console.log('\n🌐 Website URL:', project.websiteUrl);
  }
}

checkLatestProject();
