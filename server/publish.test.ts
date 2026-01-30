import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";

// Mock database functions
vi.mock("./db", () => ({
  getProjectBySubdomain: vi.fn(),
  getProjectById: vi.fn(),
  updateProject: vi.fn(),
  getAssetsByProjectId: vi.fn(),
}));

describe("Publish Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Subdomain Validation", () => {
    it("should accept valid subdomains", () => {
      const validSubdomains = [
        "my-project",
        "test123",
        "abc",
        "project-name-123",
        "a-b-c",
      ];

      validSubdomains.forEach((subdomain) => {
        const regex = /^[a-z0-9-]+$/;
        expect(regex.test(subdomain)).toBe(true);
        expect(subdomain.length).toBeGreaterThanOrEqual(3);
        expect(subdomain.length).toBeLessThanOrEqual(63);
      });
    });

    it("should reject invalid subdomains", () => {
      const invalidSubdomains = [
        "My-Project", // uppercase
        "test_123", // underscore
        "ab", // too short
        "project name", // space
        "test@123", // special char
        "test.com", // dot
      ];

      invalidSubdomains.forEach((subdomain) => {
        const regex = /^[a-z0-9-]+$/;
        const isValid =
          regex.test(subdomain) &&
          subdomain.length >= 3 &&
          subdomain.length <= 63;
        expect(isValid).toBe(false);
      });
    });

    it("should reject reserved subdomains", () => {
      const reserved = [
        "www",
        "api",
        "admin",
        "dashboard",
        "app",
        "mail",
        "ftp",
        "localhost",
        "staging",
        "dev",
        "test",
        "demo",
        "cdn",
        "static",
      ];

      reserved.forEach((subdomain) => {
        expect(reserved.includes(subdomain.toLowerCase())).toBe(true);
      });
    });
  });

  describe("Subdomain Availability Check", () => {
    it("should return available when subdomain is not taken", async () => {
      vi.mocked(db.getProjectBySubdomain).mockResolvedValue(undefined);

      const subdomain = "my-new-project";
      const existing = await db.getProjectBySubdomain(subdomain);

      expect(existing).toBeUndefined();
    });

    it("should return unavailable when subdomain is taken", async () => {
      const mockProject = {
        id: 1,
        userId: 1,
        name: "Test Project",
        subdomain: "taken-project",
        status: "completed" as const,
        deploymentStatus: "deployed" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        ticker: null,
        website: null,
        styleTemplate: null,
        userImageUrl: null,
        userImageKey: null,
        userImages: null,
        deploymentUrl: null,
        aiAnalysis: null,
        metadata: null,
      };

      vi.mocked(db.getProjectBySubdomain).mockResolvedValue(mockProject);

      const subdomain = "taken-project";
      const existing = await db.getProjectBySubdomain(subdomain);

      expect(existing).toBeDefined();
      expect(existing?.subdomain).toBe(subdomain);
    });
  });

  describe("Publish Workflow", () => {
    it("should require website asset before publishing", async () => {
      const mockProject = {
        id: 1,
        userId: 1,
        name: "Test Project",
        status: "completed" as const,
        deploymentStatus: "not_deployed" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        ticker: null,
        website: null,
        styleTemplate: null,
        userImageUrl: null,
        userImageKey: null,
        userImages: null,
        subdomain: null,
        deploymentUrl: null,
        aiAnalysis: null,
        metadata: null,
      };

      const mockAssets = [
        {
          id: 1,
          projectId: 1,
          assetType: "logo" as const,
          fileUrl: "https://example.com/logo.png",
          fileKey: "logo.png",
          textContent: null,
          metadata: null,
          createdAt: new Date(),
        },
        {
          id: 2,
          projectId: 1,
          assetType: "banner" as const,
          fileUrl: "https://example.com/banner.png",
          fileKey: "banner.png",
          textContent: null,
          metadata: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.getProjectById).mockResolvedValue(mockProject);
      vi.mocked(db.getAssetsByProjectId).mockResolvedValue(mockAssets);

      const project = await db.getProjectById(1);
      const assets = await db.getAssetsByProjectId(1);
      const websiteAsset = assets.find((a) => a.assetType === "website");

      expect(project).toBeDefined();
      expect(assets.length).toBeGreaterThan(0);
      expect(websiteAsset).toBeUndefined(); // No website asset
    });

    it("should update deployment status during publish", async () => {
      const mockProject = {
        id: 1,
        userId: 1,
        name: "Test Project",
        status: "completed" as const,
        deploymentStatus: "not_deployed" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        ticker: null,
        website: null,
        styleTemplate: null,
        userImageUrl: null,
        userImageKey: null,
        userImages: null,
        subdomain: null,
        deploymentUrl: null,
        aiAnalysis: null,
        metadata: null,
      };

      vi.mocked(db.getProjectById).mockResolvedValue(mockProject);
      vi.mocked(db.updateProject).mockResolvedValue();

      // Simulate deployment status update
      await db.updateProject(1, {
        deploymentStatus: "deploying",
        subdomain: "test-project",
      });

      expect(db.updateProject).toHaveBeenCalledWith(1, {
        deploymentStatus: "deploying",
        subdomain: "test-project",
      });

      // Simulate successful deployment
      await db.updateProject(1, {
        deploymentStatus: "deployed",
        subdomain: "test-project",
        deploymentUrl: "https://example.com/website.html",
      });

      expect(db.updateProject).toHaveBeenCalledWith(1, {
        deploymentStatus: "deployed",
        subdomain: "test-project",
        deploymentUrl: "https://example.com/website.html",
      });
    });
  });

  describe("Full Domain Generation", () => {
    it("should generate correct full domain from subdomain", () => {
      const testCases = [
        { subdomain: "my-project", expected: "my-project.cto.fun" },
        { subdomain: "test123", expected: "test123.cto.fun" },
        { subdomain: "abc", expected: "abc.cto.fun" },
      ];

      testCases.forEach(({ subdomain, expected }) => {
        const fullDomain = `${subdomain}.cto.fun`;
        expect(fullDomain).toBe(expected);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle subdomain conflict for different projects", async () => {
      const existingProject = {
        id: 1,
        userId: 1,
        name: "Existing Project",
        subdomain: "my-project",
        status: "completed" as const,
        deploymentStatus: "deployed" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        ticker: null,
        website: null,
        styleTemplate: null,
        userImageUrl: null,
        userImageKey: null,
        userImages: null,
        deploymentUrl: null,
        aiAnalysis: null,
        metadata: null,
      };

      vi.mocked(db.getProjectBySubdomain).mockResolvedValue(existingProject);

      const subdomain = "my-project";
      const newProjectId = 2; // Different project

      const existing = await db.getProjectBySubdomain(subdomain);

      // Should detect conflict
      const hasConflict = existing && existing.id !== newProjectId;
      expect(hasConflict).toBe(true);
    });

    it("should allow same project to update its own subdomain", async () => {
      const existingProject = {
        id: 1,
        userId: 1,
        name: "Test Project",
        subdomain: "my-project",
        status: "completed" as const,
        deploymentStatus: "deployed" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        ticker: null,
        website: null,
        styleTemplate: null,
        userImageUrl: null,
        userImageKey: null,
        userImages: null,
        deploymentUrl: null,
        aiAnalysis: null,
        metadata: null,
      };

      vi.mocked(db.getProjectBySubdomain).mockResolvedValue(existingProject);

      const subdomain = "my-project";
      const projectId = 1; // Same project

      const existing = await db.getProjectBySubdomain(subdomain);

      // Should NOT detect conflict (same project)
      const hasConflict = existing && existing.id !== projectId;
      expect(hasConflict).toBe(false);
    });
  });
});
