import { describe, it, expect } from "vitest";
import { testR2Connection, uploadToR2 } from "./cloudflareR2";

describe("Cloudflare R2 Integration", () => {
  it("should successfully connect to R2 bucket", async () => {
    const isConnected = await testR2Connection();
    expect(isConnected).toBe(true);
  });

  it("should upload HTML content to R2", async () => {
    const testSubdomain = `test-${Date.now()}`;
    const testHTML = `
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body><h1>Test Upload</h1></body>
      </html>
    `;

    const url = await uploadToR2(testSubdomain, testHTML);
    
    expect(url).toContain(testSubdomain);
    expect(url).toContain("ezcto.fun");
    expect(url).toMatch(/^https:\/\//);
  });
});
