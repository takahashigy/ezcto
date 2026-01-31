/**
 * Tests for AI description enhancement feature
 */
import { describe, it, expect } from "vitest";
import { enhanceDescription } from "./_core/claude";

describe("AI Description Enhancement", () => {
  it("should enhance a brief project description", async () => {
    const input = {
      projectName: "MoonDoge",
      ticker: "MDOGE",
      description: "A fun meme coin about dogs going to the moon",
    };

    const enhanced = await enhanceDescription(input);

    console.log("✅ Original description:", input.description);
    console.log("✅ Enhanced description:", enhanced);

    // Verify the enhanced description is longer and more detailed
    expect(enhanced.length).toBeGreaterThan(input.description.length);
    expect(enhanced.length).toBeGreaterThan(100); // At least 100 characters
    expect(enhanced).toContain("MoonDoge" || "MDOGE" || "dog" || "moon");
  }, 60000); // 60 second timeout for API call

  it("should handle complex project descriptions", async () => {
    const input = {
      projectName: "CyberCat",
      ticker: "CCAT",
      description: "Cyberpunk-themed cat meme coin with NFT integration and gaming features",
    };

    const enhanced = await enhanceDescription(input);

    console.log("✅ Enhanced complex description:", enhanced);

    expect(enhanced.length).toBeGreaterThan(150);
    expect(enhanced.toLowerCase()).toMatch(/cat|cyber|nft|gaming/);
  }, 60000);
});
