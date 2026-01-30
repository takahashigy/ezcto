import { describe, it, expect, beforeAll } from "vitest";
import { uploadToR2 } from "./cloudflareR2";

describe("Cloudflare R2 Deployment", () => {
  describe("uploadToR2", () => {
    it("should upload HTML content to R2 with correct path structure", async () => {
      const subdomain = "test-meme-project";
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head><title>Test Meme Project</title></head>
          <body><h1>Welcome to Test Meme!</h1></body>
        </html>
      `;

      const result = await uploadToR2(subdomain, htmlContent);

      // Should return the public URL
      expect(result).toBeDefined();
      expect(result).toContain(subdomain);
      expect(result).toContain("ezcto.fun");
      
      console.log(`[R2 Test] Successfully uploaded to: ${result}`);
    });

    it("should handle subdomain with special characters", async () => {
      const subdomain = "my-test-123";
      const htmlContent = "<html><body>Test</body></html>";

      const result = await uploadToR2(subdomain, htmlContent);

      expect(result).toBeDefined();
      expect(result).toContain("my-test-123");
      expect(result).toContain("ezcto.fun");
    });

    it("should upload large HTML content", async () => {
      const subdomain = "large-content-test";
      // Generate ~100KB of HTML content
      const largeContent = `
        <!DOCTYPE html>
        <html>
          <head><title>Large Content Test</title></head>
          <body>
            ${"<p>This is a test paragraph.</p>".repeat(1000)}
          </body>
        </html>
      `;

      const result = await uploadToR2(subdomain, largeContent);

      expect(result).toBeDefined();
      expect(result).toContain(subdomain);
      
      console.log(`[R2 Test] Large content (${largeContent.length} bytes) uploaded successfully`);
    });

    it("should overwrite existing content when uploading to same subdomain", async () => {
      const subdomain = "overwrite-test";
      
      // First upload
      const content1 = "<html><body>Version 1</body></html>";
      const result1 = await uploadToR2(subdomain, content1);
      expect(result1).toBeDefined();

      // Second upload (should overwrite)
      const content2 = "<html><body>Version 2</body></html>";
      const result2 = await uploadToR2(subdomain, content2);
      expect(result2).toBeDefined();
      expect(result2).toBe(result1); // Same URL

      console.log(`[R2 Test] Successfully overwrote content at: ${result2}`);
    });
  });

  describe("URL Format", () => {
    it("should generate correct public URL format", async () => {
      const subdomain = "url-format-test";
      const htmlContent = "<html><body>URL Test</body></html>";

      const result = await uploadToR2(subdomain, htmlContent);

      // Verify URL format: https://{subdomain}.ezcto.fun
      expect(result).toMatch(/^https:\/\/[a-z0-9-]+\.ezcto\.fun$/);
      expect(result).toBe(`https://${subdomain}.ezcto.fun`);
    });
  });

  describe("Error Handling", () => {
    it("should handle empty subdomain", async () => {
      const subdomain = "";
      const htmlContent = "<html><body>Test</body></html>";

      await expect(uploadToR2(subdomain, htmlContent)).rejects.toThrow();
    });

    it("should handle empty HTML content", async () => {
      const subdomain = "empty-content-test";
      const htmlContent = "";

      // Should still upload (empty file is valid)
      const result = await uploadToR2(subdomain, htmlContent);
      expect(result).toBeDefined();
    });

    it("should handle invalid subdomain characters", async () => {
      const subdomain = "invalid@subdomain!";
      const htmlContent = "<html><body>Test</body></html>";

      // uploadToR2 should sanitize or reject invalid characters
      await expect(uploadToR2(subdomain, htmlContent)).rejects.toThrow();
    });
  });
});
