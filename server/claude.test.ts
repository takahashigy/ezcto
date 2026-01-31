import { describe, it, expect } from "vitest";
import { callClaude, analyzeProjectInput } from "./server/_core/claude";

describe("Claude API Integration", () => {
  it("should successfully call Claude API with valid credentials", async () => {
    const response = await callClaude([
      {
        role: "user",
        content: "Say 'Hello' in one word",
      },
    ]);

    expect(response).toBeDefined();
    expect(typeof response).toBe("string");
    expect(response.length).toBeGreaterThan(0);
    
    console.log("✅ Claude API response:", response);
  }, 30000);

  it("should analyze project input and return structured data", async () => {
    const result = await analyzeProjectInput({
      projectName: "MoonDoge",
      ticker: "MDOGE",
      description: "A fun meme coin that aims to reach the moon with the community",
    });

    expect(result).toBeDefined();
    expect(result.bannerPrompt).toBeDefined();
    expect(result.logoPrompt).toBeDefined();
    expect(result.posterPrompt).toBeDefined();
    expect(result.websiteTheme).toBeDefined();
    expect(result.websiteTheme.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(result.contentSuggestions).toBeDefined();
    expect(Array.isArray(result.contentSuggestions.features)).toBe(true);
    
    console.log("✅ Analyzed project data:", JSON.stringify(result, null, 2));
  }, 60000);
});
