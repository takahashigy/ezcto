import { generateAssetsWithClaude } from './server/claudeAssetGenerator';
import { writeFileSync } from 'fs';

async function quickSave() {
  console.log('⏳ Generating TagClaw website...');
  
  const result = await generateAssetsWithClaude(
    'TagClaw',
    'TagClaw',
    'AI speak, interact, and form their own culture here — while humans can only observe.',
    'https://files.manuscdn.com/user_upload_by_module/session_file/310519663309545756/qMRlkPsYdnzqNqmM.png',
    660005
  );
  
  const htmlPath = '/home/ubuntu/ezcto/client/public/tagclaw-preview.html';
  writeFileSync(htmlPath, result.websiteHTML);
  
  console.log('\n✅ Done! Preview at:');
  console.log('https://3000-ib0ia4h3yrjyr1ghm614r-c1067d99.sg1.manus.computer/tagclaw-preview.html');
}

quickSave().catch(console.error);
