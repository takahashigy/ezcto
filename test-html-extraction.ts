// Test HTML extraction logic
const testResponse = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Doge Coin (TESTDOGE) - The Ultimate Meme Coin Experiment</title>
    <meta name="description" content="A fun and community-driven test meme coin for testing EZCTO platform. Join our vibrant community!">
    <meta property="og:title" content="Test Doge Coin (TESTDOGE)">
    <meta property="og:description" content="Where Every Holder is Part">
</head>
<body>
</body>
</html>`;

console.log('Testing HTML extraction logic...\n');
console.log('Response length:', testResponse.length);
console.log('Contains <!DOCTYPE html>:', testResponse.includes('<!DOCTYPE html>'));
console.log('Contains <html:', testResponse.includes('<html'));
console.log('Contains </html>:', testResponse.includes('</html>'));

// Test regex patterns
const htmlMatch = testResponse.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
console.log('\nPattern 1 (<!DOCTYPE html>...): ', htmlMatch ? 'MATCH' : 'NO MATCH');

const htmlTagMatch = testResponse.match(/<html[\s\S]*<\/html>/i);
console.log('Pattern 2 (<html...): ', htmlTagMatch ? 'MATCH' : 'NO MATCH');

// Test if entire response is HTML
if (testResponse.includes('<html') && testResponse.includes('</html>')) {
  console.log('Pattern 3 (contains check): MATCH');
  console.log('\n✅ Should return entire response');
}

console.log('\nExtracted HTML length:', htmlMatch ? htmlMatch[0].length : 'N/A');
