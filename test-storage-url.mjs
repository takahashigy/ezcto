import { storagePut } from './server/storage.ts';

async function test() {
  const testBuffer = Buffer.from('test content');
  const result = await storagePut('test-upload/test.txt', testBuffer, 'text/plain');
  console.log('Storage URL result:', result);
}

test().catch(console.error);
