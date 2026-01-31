/**
 * Test suite for subdomain deployment functionality
 */
import { describe, it, expect } from "vitest";
import { generateSubdomain } from "./deployment";

describe("Deployment - Subdomain Generation", () => {
  it("should generate subdomain from ticker", () => {
    const subdomain = generateSubdomain("My Cool Project", "COOL");
    
    expect(subdomain).toMatch(/^cool-[a-z0-9]{4}$/);
    expect(subdomain.length).toBeGreaterThanOrEqual(3);
    expect(subdomain.length).toBeLessThanOrEqual(63);
  });

  it("should generate subdomain from project name when ticker is not provided", () => {
    const subdomain = generateSubdomain("Amazing Meme Coin");
    
    expect(subdomain).toMatch(/^amazing-meme-coin-[a-z0-9]{4}$/);
  });

  it("should handle special characters in project name", () => {
    const subdomain = generateSubdomain("Test@Project#123!");
    
    // Should remove special characters
    expect(subdomain).toMatch(/^testproject123-[a-z0-9]{4}$/);
  });

  it("should handle Chinese characters", () => {
    const subdomain = generateSubdomain("测试项目", "测试");
    
    // Should fallback to site-xxxx when no valid characters
    expect(subdomain).toMatch(/^site-[a-z0-9]{4}$/);
  });

  it("should handle very long project names", () => {
    const longName = "This is a very long project name that exceeds the maximum allowed length for a subdomain";
    const subdomain = generateSubdomain(longName);
    
    expect(subdomain.length).toBeLessThanOrEqual(63);
  });

  it("should handle very short project names", () => {
    const subdomain = generateSubdomain("A");
    
    expect(subdomain.length).toBeGreaterThanOrEqual(3);
    // Short names like 'A' become 'a-xxxx'
    expect(subdomain).toMatch(/^a-[a-z0-9]{4}$/);
  });

  it("should generate unique subdomains for same input", () => {
    const subdomain1 = generateSubdomain("Test Project", "TEST");
    const subdomain2 = generateSubdomain("Test Project", "TEST");
    
    // Should be different due to random suffix
    expect(subdomain1).not.toBe(subdomain2);
    expect(subdomain1).toMatch(/^test-[a-z0-9]{4}$/);
    expect(subdomain2).toMatch(/^test-[a-z0-9]{4}$/);
  });

  it("should handle empty strings", () => {
    const subdomain = generateSubdomain("", "");
    
    expect(subdomain).toMatch(/^site-[a-z0-9]{4}$/);
    expect(subdomain.length).toBeGreaterThanOrEqual(3);
  });

  it("should handle spaces and hyphens correctly", () => {
    const subdomain = generateSubdomain("My   Cool   Project");
    
    // Multiple spaces should be collapsed to single hyphen
    expect(subdomain).toMatch(/^my-cool-project-[a-z0-9]{4}$/);
  });

  it("should convert to lowercase", () => {
    const subdomain = generateSubdomain("UPPERCASE PROJECT", "UPPER");
    
    expect(subdomain).toBe(subdomain.toLowerCase());
    expect(subdomain).toMatch(/^upper-[a-z0-9]{4}$/);
  });
});
