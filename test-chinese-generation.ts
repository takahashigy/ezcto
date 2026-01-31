import { detectLanguageFromInputs, getLanguageInfo } from './server/_core/languageDetector';

// Test 1: Chinese input
console.log('=== Test 1: Chinese Input ===');
const chineseResult = detectLanguageFromInputs({
  projectName: '测试狗币',
  ticker: '测试狗',
  description: '这是一个基于社区驱动的Meme代币项目，致力于打造最有趣的加密货币社区。',
});
const chineseInfo = getLanguageInfo(chineseResult);
console.log('Detected Language:', chineseInfo.name, `(${chineseResult})`);
console.log('HTML Lang:', chineseInfo.htmlLang);

// Test 2: English input
console.log('\n=== Test 2: English Input ===');
const englishResult = detectLanguageFromInputs({
  projectName: 'Test Doge Coin',
  ticker: 'TESTDOGE',
  description: 'A community-driven meme token built for fun and friendship.',
});
const englishInfo = getLanguageInfo(englishResult);
console.log('Detected Language:', englishInfo.name, `(${englishResult})`);
console.log('HTML Lang:', englishInfo.htmlLang);

// Test 3: Mixed input (Chinese project name + English description)
console.log('\n=== Test 3: Mixed Input (More Chinese) ===');
const mixedResult1 = detectLanguageFromInputs({
  projectName: '月亮狗',
  ticker: 'MOONDOGE',
  description: '一个有趣的社区代币项目，目标是登月！Join our community and go to the moon!',
});
const mixedInfo1 = getLanguageInfo(mixedResult1);
console.log('Detected Language:', mixedInfo1.name, `(${mixedResult1})`);
console.log('HTML Lang:', mixedInfo1.htmlLang);

// Test 4: Mixed input (English project name + Chinese description)
console.log('\n=== Test 4: Mixed Input (More English) ===');
const mixedResult2 = detectLanguageFromInputs({
  projectName: 'Moon Doge',
  ticker: 'MOONDOGE',
  description: 'A fun community token project aiming for the moon! 加入我们的社区一起登月！',
});
const mixedInfo2 = getLanguageInfo(mixedResult2);
console.log('Detected Language:', mixedInfo2.name, `(${mixedResult2})`);
console.log('HTML Lang:', mixedInfo2.htmlLang);

console.log('\n✅ Language detection tests completed!');
