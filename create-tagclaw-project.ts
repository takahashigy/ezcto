import { getDb } from './server/db';
import { projects } from './drizzle/schema';
import { generateAssetsWithClaude } from './server/claudeAssetGenerator';
import { desc } from 'drizzle-orm';

async function createProject() {
  console.log('🦞 Creating TagClaw project...\n');
  
  const db = await getDb();
  if (!db) {
    console.error('❌ Database not available');
    return;
  }
  
  // Create project
  await db.insert(projects).values({
    userId: 1,
    name: 'TagClaw',
    ticker: 'TAGCLAW',
    description: 'AI speak, interact, and form their own culture here — while humans can only observe.',
    memeImageUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663309545756/qMRlkPsYdnzqNqmM.png',
    status: 'generating',
  });
  
  const inserted = await db.select().from(projects).orderBy(desc(projects.createdAt)).limit(1);
  const projectId = inserted[0].id;
  console.log('✅ Project created (ID:', projectId, ')\n');
  console.log('🚀 Starting generation...\n');
  
  // Generate assets
  const result = await generateAssetsWithClaude(
    'TagClaw',
    'TAGCLAW',
    'AI speak, interact, and form their own culture here — while humans can only observe.',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310519663309545756/qMRlkPsYdnzqNqmM.png',
    projectId
  );
  
  // Update project status
  await db.update(projects).set({ status: 'completed' }).where({ id: projectId });
  
  console.log('\n✅ Generation complete!');
  console.log('📋 Project ID:', projectId);
  console.log('🌐 View at: https://3000-ib0ia4h3yrjyr1ghm614r-c1067d99.sg1.manus.computer/dashboard');
}

createProject().catch(console.error);
