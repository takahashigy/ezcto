import { config } from 'dotenv';
config();

const NANOBANANA_API_KEY = process.env.NANOBANANA_API_KEY;
const API_BASE_URL = 'https://api.google-banana.com';

async function testNanobananaAPI() {
  console.log('🧪 Testing Nanobanana API Connection...\n');
  console.log('API Key:', NANOBANANA_API_KEY?.substring(0, 20) + '...');
  console.log('Base URL:', API_BASE_URL);
  console.log('Model: gemini-3-pro-image-preview-2K\n');

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
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:');
      console.error(errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ API Response Structure:');
    console.log(JSON.stringify(data, null, 2));

    if (data.choices?.[0]?.message?.content) {
      const imageUrl = data.choices[0].message.content;
      console.log('\n🖼️  Generated Image URL:');
      console.log(imageUrl);
      
      // Test if the URL is accessible
      console.log('\n🔍 Testing image URL accessibility...');
      const imageResponse = await fetch(imageUrl);
      console.log('Image URL Status:', imageResponse.status, imageResponse.statusText);
      console.log('Content-Type:', imageResponse.headers.get('content-type'));
      console.log('Content-Length:', imageResponse.headers.get('content-length'));
      
      if (imageResponse.ok) {
        console.log('✅ Image URL is accessible!');
      } else {
        console.log('❌ Image URL is not accessible');
      }
    }

    console.log('\n🎉 Test completed successfully!');
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`\n❌ Test failed after ${elapsed}s`);
    console.error('Error:', error);
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if ('cause' in error) {
        console.error('Error cause:', error.cause);
      }
    }
  }
}

testNanobananaAPI();
