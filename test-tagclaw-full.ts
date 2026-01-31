import { generateAssetsWithClaude } from './server/claudeAssetGenerator';
import { getDb } from './server/db';
import { projects } from './drizzle/schema';
import { desc } from 'drizzle-orm';

async function testTagClawGeneration() {
  console.log('🦞 Starting TagClaw Full Generation Test...\n');
  
  const projectName = 'TagClaw';
  const ticker = 'TagClaw';
  const description = 'AI speak, interact, and form their own culture here — while humans can only observe.';
  const memeImageUrl = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663309545756/qMRlkPsYdnzqNqmM.png';
  
  console.log('📋 Project Info:');
  console.log('  Name:', projectName);
  console.log('  Ticker:', ticker);
  console.log('  Description:', description);
  console.log('  Meme Image:', memeImageUrl);
  console.log();
  
  // Create test project in database
  const db = await getDb();
  if (!db) {
    console.error('❌ Database not available');
    return;
  }
  
  await db.insert(projects).values({
    userId: 1,
    name: projectName, // Fixed: add name field
    projectName,
    ticker,
    description,
    memeImageUrl,
    status: 'generating',
  });
  
  const inserted = await db.select().from(projects).orderBy(desc(projects.createdAt)).limit(1);
  const projectId = inserted[0].id;
  console.log('✅ Test project created (ID:', projectId, ')\n');
  
  // Run full generation
  console.log('🚀 Starting full generation pipeline...\n');
  const startTime = Date.now();
  
  try {
    const result = await generateAssetsWithClaude(
      projectName,
      ticker,
      description,
      memeImageUrl,
      projectId
    );
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ Generation completed in', duration, 'seconds\n');
    console.log('📦 Generated Assets:');
    console.log('  PayDex Banner:', result.paydexBanner.url);
    console.log('  X Banner:', result.xBanner.url);
    console.log('  Logo:', result.logo.url);
    console.log('  Hero Background:', result.heroBackground.url);
    console.log('  Feature Icons:', result.featureIcons.length, 'icons');
    console.log('  Community Scene:', result.communityScene.url);
    console.log('  Website HTML:', result.websiteHTML.length, 'chars');
    console.log();
    console.log('🎨 Brand Strategy:');
    console.log('  Personality:', result.brandStrategy.personality);
    console.log('  Visual Style:', result.brandStrategy.visualStyle);
    console.log();
    console.log('🎨 Color Scheme:');
    console.log('  Primary:', result.colorScheme.primary);
    console.log('  Secondary:', result.colorScheme.secondary);
    console.log('  Accent:', result.colorScheme.accent);
    console.log();
    console.log('📝 Website Content:');
    console.log('  Headline:', result.websiteContent.headline);
    console.log('  Tagline:', result.websiteContent.tagline);
    console.log('  Features:', result.websiteContent.features.length, 'features');
    
  } catch (error) {
    console.error('\n❌ Generation failed:', error);
    throw error;
  }
}

testTagClawGeneration();
