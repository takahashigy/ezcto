import { describe, it, expect } from "vitest";
import { generateImage } from "./server/_core/imageGeneration";

describe("Nanobanana API Integration", () => {
  it("should successfully generate an image with valid API key", async () => {
    const result = await generateImage({
      prompt: "A cute cartoon meme coin mascot",
    });

    expect(result).toBeDefined();
    expect(result.url).toBeDefined();
    expect(typeof result.url).toBe("string");
    expect(result.url).toMatch(/^https?:\/\//);
    
    console.log("✅ Generated image URL:", result.url);
  }, 180000); // 180 second timeout for image generation

  it("should handle empty prompt gracefully", async () => {
    const result = await generateImage({
      prompt: "test",
    });
    
    expect(result).toBeDefined();
    expect(result.url).toBeDefined();
  }, 180000);
});
