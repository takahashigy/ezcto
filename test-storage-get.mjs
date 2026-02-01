import { storagePut, storageGet } from './server/storage.ts';

async function test() {
  // First upload
  const testBuffer = Buffer.from('test content for download');
  const uploadResult = await storagePut('test-download/test.txt', testBuffer, 'text/plain');
  console.log('Upload URL:', uploadResult.url);
  
  // Then get download URL
  const downloadResult = await storageGet('test-download/test.txt');
  console.log('Download URL:', downloadResult.url);
  
  // Try to download
  const response = await fetch(downloadResult.url);
  console.log('Download status:', response.status, response.statusText);
  if (response.ok) {
    const content = await response.text();
    console.log('Downloaded content:', content);
  }
}

test().catch(console.error);
