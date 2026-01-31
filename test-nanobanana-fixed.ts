import { config } from 'dotenv';
config();

const NANOBANANA_API_KEY = process.env.NANOBANANA_API_KEY;
const API_BASE_URL = 'https://api.google-banana.com';

async function testNanobananaAPI() {
  console.log('🧪 Testing Nanobanana API with URL extraction...\n');

  const testPrompt = 'A simple cartoon Shiba Inu dog, golden yellow color, smiling, transparent background';
  
  console.log('📝 Test Prompt:', testPrompt);
  console.log('⏳ Sending request...\n');

  const startTime = Date.now();

  try {
    const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NANOBANANA_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gemini-3-pro-image-preview-2K',
        messages: [
          {
            role: 'user',
            content: testPrompt,
          },
        ],
      }),
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Response received in ${elapsed}s`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('📦 Raw content:', content);
    
    // Extract URL from Markdown format
    const urlMatch = content.match(/!\[image\]\((.+?)\)/);
    
    if (!urlMatch || !urlMatch[1]) {
      console.error('❌ Failed to extract URL from:', content);
      return;
    }
    
    const imageUrl = urlMatch[1];
    console.log('✅ Extracted URL:', imageUrl);
    
    // Test if the URL is accessible
    console.log('\n🔍 Testing image URL accessibility...');
    const imageResponse = await fetch(imageUrl);
    console.log('Status:', imageResponse.status, imageResponse.statusText);
    console.log('Content-Type:', imageResponse.headers.get('content-type'));
    console.log('Content-Length:', imageResponse.headers.get('content-length'));
    
    if (imageResponse.ok) {
      console.log('✅ Image URL is accessible!');
      console.log('\n🎉 Test completed successfully!');
    } else {
      console.log('❌ Image URL is not accessible');
    }
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`\n❌ Test failed after ${elapsed}s`);
    console.error('Error:', error);
  }
}

testNanobananaAPI();
