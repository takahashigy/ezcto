import { describe, it, expect } from 'vitest';
import { generateImage } from './_core/imageGeneration';

describe('Nanobanana API Integration', () => {
  it('should generate image with new API key', async () => {
    const result = await generateImage({
      prompt: 'A simple test image: blue circle on white background',
    });
    
    expect(result).toBeDefined();
    expect(result.url).toBeTruthy();
    expect(typeof result.url).toBe('string');
    expect(result.url).toMatch(/^https?:\/\//);
    
    console.log('✅ Image generated successfully:', result.url);
  }, 60000); // 60 second timeout
});
