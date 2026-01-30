import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeProject } from "./aiAnalyzer";
import { generateWebsiteHTML } from "./websiteTemplate";

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            narrativeType: "community",
            layoutStyle: "minimal",
            colorPalette: {
              primary: "#ff6b35",
              secondary: "#f7931e",
              background: "#fef9ef",
              text: "#2d3e2d",
              accent: "#4ecdc4",
            },
            vibe: "friendly",
            targetAudience: "Crypto enthusiasts and meme lovers",
          }),
        },
      },
    ],
  }),
}));

describe("Preview Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AI Analysis for Preview", () => {
    it("should analyze project and return structured analysis", async () => {
      const analysis = await analyzeProject(
        "https://example.com/doge.png",
        "DogeKing",
        "DGKNG",
        "A community-driven meme project celebrating the king of all doges"
      );

      expect(analysis).toHaveProperty("narrativeType");
      expect(analysis).toHaveProperty("layoutStyle");
      expect(analysis).toHaveProperty("colorPalette");
      expect(analysis).toHaveProperty("vibe");
      expect(analysis).toHaveProperty("targetAudience");

      expect(["community", "tech", "culture", "gaming"]).toContain(
        analysis.narrativeType
      );
      expect(["minimal", "playful", "cyberpunk", "retro"]).toContain(
        analysis.layoutStyle
      );
      expect(["friendly", "edgy", "mysterious", "energetic"]).toContain(
        analysis.vibe
      );
    });
  });

  describe("Preview HTML Generation", () => {
    it("should generate preview HTML with custom color palette", () => {
      const customAnalysis = {
        narrativeType: "community" as const,
        layoutStyle: "minimal" as const,
        colorPalette: {
          primary: "#ff0000",
          secondary: "#00ff00",
          background: "#0000ff",
          text: "#ffffff",
          accent: "#ffff00",
        },
        vibe: "friendly" as const,
        targetAudience: "Test audience",
      };

      const html = generateWebsiteHTML(
        {
          projectName: "TestProject",
          ticker: "TEST",
          description: "Test description",
          logoUrl: "https://example.com/logo.png",
          bannerUrl: "https://example.com/banner.png",
        },
        customAnalysis
      );

      // Check that custom colors are applied
      expect(html).toContain("#ff0000"); // primary
      expect(html).toContain("#00ff00"); // secondary
      expect(html).toContain("#0000ff"); // background
      expect(html).toContain("#ffffff"); // text
      expect(html).toContain("#ffff00"); // accent
    });

    it("should generate preview HTML with different layout styles", () => {
      const layoutStyles = ["minimal", "playful", "cyberpunk", "retro"] as const;

      layoutStyles.forEach((style) => {
        const analysis = {
          narrativeType: "community" as const,
          layoutStyle: style,
          colorPalette: {
            primary: "#000000",
            secondary: "#111111",
            background: "#ffffff",
            text: "#000000",
            accent: "#ff0000",
          },
          vibe: "friendly" as const,
          targetAudience: "Test",
        };

        const html = generateWebsiteHTML(
          {
            projectName: "TestProject",
            ticker: "TEST",
            description: "Test description",
            logoUrl: "https://example.com/logo.png",
            bannerUrl: "https://example.com/banner.png",
          },
          analysis
        );

        // Check that layout style class is applied
        expect(html).toContain(`class="hero ${style}"`);
      });
    });

    it("should generate valid HTML structure", () => {
      const analysis = {
        narrativeType: "community" as const,
        layoutStyle: "minimal" as const,
        colorPalette: {
          primary: "#000000",
          secondary: "#111111",
          background: "#ffffff",
          text: "#000000",
          accent: "#ff0000",
        },
        vibe: "friendly" as const,
        targetAudience: "Test",
      };

      const html = generateWebsiteHTML(
        {
          projectName: "TestProject",
          ticker: "TEST",
          description: "Test description",
          logoUrl: "https://example.com/logo.png",
          bannerUrl: "https://example.com/banner.png",
        },
        analysis
      );

      // Check HTML structure
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html lang=\"en\">");
      expect(html).toContain("<head>");
      expect(html).toContain("<body>");
      expect(html).toContain("</body>");
      expect(html).toContain("</html>");

      // Check meta tags
      expect(html).toContain("<meta charset=\"UTF-8\">");
      expect(html).toContain("<meta name=\"viewport\"");
      expect(html).toContain("<meta name=\"description\"");

      // Check content sections
      expect(html).toContain("TestProject");
      expect(html).toContain("$TEST");
      expect(html).toContain("Test description");
    });
  });

  describe("Color Palette Validation", () => {
    it("should accept valid hex colors", () => {
      const validColors = [
        "#000000",
        "#ffffff",
        "#ff6b35",
        "#4ecdc4",
        "#abc",
      ];

      validColors.forEach((color) => {
        const analysis = {
          narrativeType: "community" as const,
          layoutStyle: "minimal" as const,
          colorPalette: {
            primary: color,
            secondary: color,
            background: color,
            text: color,
            accent: color,
          },
          vibe: "friendly" as const,
          targetAudience: "Test",
        };

        const html = generateWebsiteHTML(
          {
            projectName: "Test",
            ticker: "TEST",
            description: "Test",
            logoUrl: "https://example.com/logo.png",
            bannerUrl: "https://example.com/banner.png",
          },
          analysis
        );

        expect(html).toContain(color);
      });
    });
  });

  describe("Preview Performance", () => {
    it("should generate preview HTML quickly (< 100ms)", async () => {
      const analysis = {
        narrativeType: "community" as const,
        layoutStyle: "minimal" as const,
        colorPalette: {
          primary: "#000000",
          secondary: "#111111",
          background: "#ffffff",
          text: "#000000",
          accent: "#ff0000",
        },
        vibe: "friendly" as const,
        targetAudience: "Test",
      };

      const startTime = Date.now();

      generateWebsiteHTML(
        {
          projectName: "TestProject",
          ticker: "TEST",
          description: "Test description",
          logoUrl: "https://example.com/logo.png",
          bannerUrl: "https://example.com/banner.png",
        },
        analysis
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });
  });
});
