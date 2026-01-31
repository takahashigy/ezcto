import { getDb } from './server/db';
import { projects, assets } from './drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { writeFileSync } from 'fs';

async function findCompleted() {
  const db = await getDb();
  if (!db) return;
  
  // Find completed TagClaw projects
  const tagclawProjects = await db.select().from(projects)
    .where(and(
      eq(projects.name, 'TagClaw'),
      eq(projects.status, 'completed')
    ));
  
  console.log(`Found ${tagclawProjects.length} completed TagClaw projects\n`);
  
  for (const project of tagclawProjects) {
    console.log(`Project ID: ${project.id}`);
    console.log(`  Ticker: ${project.ticker}`);
    console.log(`  Created: ${project.createdAt}`);
    
    // Find website asset
    const websiteAssets = await db.select().from(assets)
      .where(and(
        eq(assets.projectId, project.id),
        eq(assets.assetType, 'website')
      ));
    
    if (websiteAssets.length > 0 && websiteAssets[0].textContent) {
      const htmlPath = `/home/ubuntu/ezcto/client/public/tagclaw-${project.id}.html`;
      writeFileSync(htmlPath, websiteAssets[0].textContent);
      console.log(`  ✅ Website saved to: ${htmlPath}`);
      console.log(`  🌐 Preview: https://3000-ib0ia4h3yrjyr1ghm614r-c1067d99.sg1.manus.computer/tagclaw-${project.id}.html`);
    } else {
      console.log(`  ❌ No website asset found`);
    }
    console.log();
  }
}

findCompleted();
