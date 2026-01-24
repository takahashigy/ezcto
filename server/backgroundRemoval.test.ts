import { describe, it, expect } from "vitest";
import { removeBackground } from "./_core/backgroundRemoval";

describe("Background Removal API", () => {
  it("should validate remove.bg API key", async () => {
    // Use a publicly accessible test image
    const testImageUrl = "https://www.remove.bg/example.jpg";
    
    try {
      const result = await removeBackground({ imageUrl: testImageUrl });
      
      // Should return a valid result with url and fileKey
      expect(result).toBeDefined();
      expect(result.url).toBeDefined();
      expect(result.fileKey).toBeDefined();
      expect(typeof result.url).toBe("string");
      expect(result.url.length).toBeGreaterThan(0);
      
      console.log("[Test] ✅ remove.bg API key is valid");
    } catch (error: any) {
      if (error.message.includes("Invalid API key") || error.message.includes("401")) {
        throw new Error("Invalid remove.bg API key. Please check your REMOVE_BG_API_KEY environment variable.");
      }
      throw error;
    }
  }, 30000); // 30s timeout for API call
});
