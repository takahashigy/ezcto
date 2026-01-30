/**
 * Tests for AI-driven website generation system
 */

import { describe, it, expect, beforeAll } from "vitest";
import { analyzeProject } from "./aiAnalyzer";
import { generateWebsiteHTML } from "./websiteTemplate";
import type { ProjectAnalysis } from "./aiAnalyzer";

describe("AI Website Generator", () => {
  describe("Website Template Generation", () => {
    it("should generate valid HTML with all required sections", () => {
      const mockAnalysis: ProjectAnalysis = {
        narrativeType: "community",
        layoutStyle: "minimal",
        colorPalette: {
          primary: "#FFD700",
          secondary: "#FF6B35",
          background: "#FFFFFF",
          text: "#1A1A1A",
          accent: "#00D9FF",
        },
        vibe: "friendly",
        targetAudience: "Crypto enthusiasts and meme lovers",
      };

      const mockData = {
        projectName: "TestCoin",
        ticker: "TEST",
        description: "A test meme cryptocurrency project",
        logoUrl: "https://example.com/logo.png",
        bannerUrl: "https://example.com/banner.png",
        twitterUrl: "https://twitter.com/testcoin",
        telegramUrl: "https://t.me/testcoin",
      };

      const html = generateWebsiteHTML(mockData, mockAnalysis);

      // Check basic HTML structure
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("<head>");
      expect(html).toContain("<body>");
      expect(html).toContain("</html>");

      // Check meta tags
      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain('<meta name="viewport"');
      expect(html).toContain('<meta property="og:title"');
      expect(html).toContain('<meta property="og:description"');
      expect(html).toContain('<meta property="og:image"');

      // Check project data is included
      expect(html).toContain("TestCoin");
      expect(html).toContain("TEST");
      expect(html).toContain("A test meme cryptocurrency project");

      // Check color palette is applied
      expect(html).toContain("--primary: #FFD700");
      expect(html).toContain("--secondary: #FF6B35");
      expect(html).toContain("--background: #FFFFFF");
      expect(html).toContain("--text: #1A1A1A");

      // Check social links
      expect(html).toContain("https://twitter.com/testcoin");
      expect(html).toContain("https://t.me/testcoin");

      // Check sections are included
      expect(html).toContain("hero");
      expect(html).toContain("footer");
    });

    it("should generate different layouts based on layoutStyle", () => {
      const mockData = {
        projectName: "TestCoin",
        ticker: "TEST",
        description: "Test description",
        logoUrl: "https://example.com/logo.png",
        bannerUrl: "https://example.com/banner.png",
      };

      const styles = ["minimal", "playful", "cyberpunk", "retro"] as const;

      styles.forEach((style) => {
        const analysis: ProjectAnalysis = {
          narrativeType: "community",
          layoutStyle: style,
          colorPalette: {
            primary: "#FFD700",
            secondary: "#FF6B35",
            background: "#FFFFFF",
            text: "#1A1A1A",
            accent: "#00D9FF",
          },
          vibe: "friendly",
          targetAudience: "Test audience",
        };

        const html = generateWebsiteHTML(mockData, analysis);

        // Check that style-specific classes are present
        expect(html).toContain(`hero ${style}`);
      });
    });

    it("should include different sections based on narrativeType", () => {
      const mockData = {
        projectName: "TestCoin",
        ticker: "TEST",
        description: "Test description",
        logoUrl: "https://example.com/logo.png",
        bannerUrl: "https://example.com/banner.png",
      };

      // Test community narrative
      const communityAnalysis: ProjectAnalysis = {
        narrativeType: "community",
        layoutStyle: "minimal",
        colorPalette: {
          primary: "#FFD700",
          secondary: "#FF6B35",
          background: "#FFFFFF",
          text: "#1A1A1A",
          accent: "#00D9FF",
        },
        vibe: "friendly",
        targetAudience: "Community members",
      };

      const communityHtml = generateWebsiteHTML(mockData, communityAnalysis);
      expect(communityHtml).toContain("Join Our Community");

      // Test tech narrative
      const techAnalysis: ProjectAnalysis = {
        ...communityAnalysis,
        narrativeType: "tech",
      };

      const techHtml = generateWebsiteHTML(mockData, techAnalysis);
      expect(techHtml).toContain("Features");
      expect(techHtml).toContain("Roadmap");
    });

    it("should handle optional fields gracefully", () => {
      const mockAnalysis: ProjectAnalysis = {
        narrativeType: "community",
        layoutStyle: "minimal",
        colorPalette: {
          primary: "#FFD700",
          secondary: "#FF6B35",
          background: "#FFFFFF",
          text: "#1A1A1A",
          accent: "#00D9FF",
        },
        vibe: "friendly",
        targetAudience: "Test audience",
      };

      // Test with minimal data (no social links)
      const minimalData = {
        projectName: "TestCoin",
        ticker: "TEST",
        description: "Test description",
        logoUrl: "https://example.com/logo.png",
        bannerUrl: "https://example.com/banner.png",
      };

      const html = generateWebsiteHTML(minimalData, mockAnalysis);

      // Should still generate valid HTML
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("TestCoin");
      expect(html).toContain("TEST");
    });

    it("should escape HTML in user input to prevent XSS", () => {
      const mockAnalysis: ProjectAnalysis = {
        narrativeType: "community",
        layoutStyle: "minimal",
        colorPalette: {
          primary: "#FFD700",
          secondary: "#FF6B35",
          background: "#FFFFFF",
          text: "#1A1A1A",
          accent: "#00D9FF",
        },
        vibe: "friendly",
        targetAudience: "Test audience",
      };

      const maliciousData = {
        projectName: '<script>alert("XSS")</script>',
        ticker: '<img src=x onerror=alert(1)>',
        description: '<a href="javascript:alert(1)">Click</a>',
        logoUrl: "https://example.com/logo.png",
        bannerUrl: "https://example.com/banner.png",
      };

      const html = generateWebsiteHTML(maliciousData, mockAnalysis);

      // Should escape HTML tags in user content
      // Note: HTML will contain <script> tags for the template's own JavaScript
      // We need to check that user input is escaped in the content areas
      expect(html).toContain('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
      expect(html).toContain('&lt;img src=x');
      expect(html).toContain('&lt;a href=&quot;javascript:alert(1)&quot;&gt;Click&lt;/a&gt;');
      
      // Verify dangerous code is NOT executable (even though text is present, it's escaped)
      // The key is that < and > are escaped to &lt; and &gt;
      expect(html).not.toContain('<script>alert');
      expect(html).not.toContain('<img src=x onerror=');
      expect(html).not.toContain('<a href="javascript:');
    });
  });

  describe("Template Validation", () => {
    it("should generate mobile-responsive HTML", () => {
      const mockAnalysis: ProjectAnalysis = {
        narrativeType: "community",
        layoutStyle: "minimal",
        colorPalette: {
          primary: "#FFD700",
          secondary: "#FF6B35",
          background: "#FFFFFF",
          text: "#1A1A1A",
          accent: "#00D9FF",
        },
        vibe: "friendly",
        targetAudience: "Test audience",
      };

      const mockData = {
        projectName: "TestCoin",
        ticker: "TEST",
        description: "Test description",
        logoUrl: "https://example.com/logo.png",
        bannerUrl: "https://example.com/banner.png",
      };

      const html = generateWebsiteHTML(mockData, mockAnalysis);

      // Check for responsive meta tag
      expect(html).toContain(
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
      );

      // Check for responsive CSS
      expect(html).toContain("@media (max-width: 768px)");
      expect(html).toContain("clamp(");
    });

    it("should include JavaScript for interactions", () => {
      const mockAnalysis: ProjectAnalysis = {
        narrativeType: "community",
        layoutStyle: "minimal",
        colorPalette: {
          primary: "#FFD700",
          secondary: "#FF6B35",
          background: "#FFFFFF",
          text: "#1A1A1A",
          accent: "#00D9FF",
        },
        vibe: "friendly",
        targetAudience: "Test audience",
      };

      const mockData = {
        projectName: "TestCoin",
        ticker: "TEST",
        description: "Test description",
        logoUrl: "https://example.com/logo.png",
        bannerUrl: "https://example.com/banner.png",
      };

      const html = generateWebsiteHTML(mockData, mockAnalysis);

      // Check for JavaScript
      expect(html).toContain("<script>");
      expect(html).toContain("</script>");
      expect(html).toContain("IntersectionObserver");
      expect(html).toContain("addEventListener");
    });
  });
});
