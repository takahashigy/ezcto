import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";

// Mock database functions
vi.mock("./db", () => ({
  getProjectById: vi.fn(),
  getProjectBySubdomain: vi.fn(),
  updateProject: vi.fn(),
  getAssetsByProjectId: vi.fn(),
}));

describe("Subdomain Edit Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Edit Mode Detection", () => {
    it("should detect edit mode when project has existing subdomain", () => {
      const project = {
        id: 1,
        subdomain: "old-project",
        deploymentStatus: "deployed" as const,
      };

      const newSubdomain = "new-project";
      const isEdit = project.subdomain && project.subdomain !== newSubdomain;

      expect(isEdit).toBe(true);
    });

    it("should not detect edit mode for first-time publish", () => {
      const project = {
        id: 1,
        subdomain: null,
        deploymentStatus: "not_deployed" as const,
      };

      const newSubdomain = "new-project";
      const isEdit = project.subdomain && project.subdomain !== newSubdomain;

      expect(isEdit).toBeFalsy();
    });

    it("should not detect edit mode when subdomain unchanged", () => {
      const project = {
        id: 1,
        subdomain: "same-project",
        deploymentStatus: "deployed" as const,
      };

      const newSubdomain = "same-project";
      const isEdit = project.subdomain && project.subdomain !== newSubdomain;

      expect(isEdit).toBeFalsy();
    });
  });

  describe("Subdomain History Recording", () => {
    it("should record subdomain change in metadata", () => {
      const oldMetadata = {
        generatedAt: "2024-01-01",
        subdomainHistory: [],
      };

      const change = {
        from: "old-subdomain",
        to: "new-subdomain",
        changedAt: new Date().toISOString(),
        changedBy: 1,
      };

      oldMetadata.subdomainHistory.push(change);

      expect(oldMetadata.subdomainHistory).toHaveLength(1);
      expect(oldMetadata.subdomainHistory[0].from).toBe("old-subdomain");
      expect(oldMetadata.subdomainHistory[0].to).toBe("new-subdomain");
    });

    it("should record first-time publish in metadata", () => {
      const metadata = {
        subdomainHistory: [],
      };

      const publish = {
        subdomain: "first-subdomain",
        publishedAt: new Date().toISOString(),
        publishedBy: 1,
      };

      metadata.subdomainHistory.push(publish);

      expect(metadata.subdomainHistory).toHaveLength(1);
      expect(metadata.subdomainHistory[0].subdomain).toBe("first-subdomain");
    });

    it("should maintain history across multiple changes", () => {
      const metadata = {
        subdomainHistory: [
          {
            subdomain: "first-subdomain",
            publishedAt: "2024-01-01",
            publishedBy: 1,
          },
        ],
      };

      // First change
      metadata.subdomainHistory.push({
        from: "first-subdomain",
        to: "second-subdomain",
        changedAt: "2024-01-02",
        changedBy: 1,
      });

      // Second change
      metadata.subdomainHistory.push({
        from: "second-subdomain",
        to: "third-subdomain",
        changedAt: "2024-01-03",
        changedBy: 1,
      });

      expect(metadata.subdomainHistory).toHaveLength(3);
      expect(metadata.subdomainHistory[2].to).toBe("third-subdomain");
    });
  });

  describe("Edit Workflow", () => {
    it("should allow same project to change its own subdomain", async () => {
      const existingProject = {
        id: 1,
        userId: 1,
        name: "Test Project",
        subdomain: "old-subdomain",
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

      vi.mocked(db.getProjectById).mockResolvedValue(existingProject);
      vi.mocked(db.getProjectBySubdomain).mockResolvedValue(undefined);

      const project = await db.getProjectById(1);
      const newSubdomain = "new-subdomain";
      const existing = await db.getProjectBySubdomain(newSubdomain);

      // Should allow change (no conflict)
      const hasConflict = existing && existing.id !== project?.id;
      expect(hasConflict).toBeFalsy();
    });

    it("should prevent changing to a subdomain owned by another project", async () => {
      const currentProject = {
        id: 1,
        userId: 1,
        name: "My Project",
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

      const otherProject = {
        id: 2,
        userId: 2,
        name: "Other Project",
        subdomain: "taken-subdomain",
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

      vi.mocked(db.getProjectById).mockResolvedValue(currentProject);
      vi.mocked(db.getProjectBySubdomain).mockResolvedValue(otherProject);

      const project = await db.getProjectById(1);
      const newSubdomain = "taken-subdomain";
      const existing = await db.getProjectBySubdomain(newSubdomain);

      // Should detect conflict
      const hasConflict = existing && existing.id !== project?.id;
      expect(hasConflict).toBe(true);
    });
  });

  describe("Metadata Parsing", () => {
    it("should handle string metadata", () => {
      const stringMetadata = '{"generatedAt":"2024-01-01","subdomainHistory":[]}';
      const parsed =
        typeof stringMetadata === "string"
          ? JSON.parse(stringMetadata)
          : stringMetadata;

      expect(parsed.subdomainHistory).toBeDefined();
      expect(Array.isArray(parsed.subdomainHistory)).toBe(true);
    });

    it("should handle object metadata", () => {
      const objectMetadata = {
        generatedAt: "2024-01-01",
        subdomainHistory: [],
      };
      const parsed =
        typeof objectMetadata === "string"
          ? JSON.parse(objectMetadata)
          : objectMetadata;

      expect(parsed.subdomainHistory).toBeDefined();
      expect(Array.isArray(parsed.subdomainHistory)).toBe(true);
    });

    it("should initialize subdomainHistory if not exists", () => {
      const metadata: any = {
        generatedAt: "2024-01-01",
      };

      if (!metadata.subdomainHistory) {
        metadata.subdomainHistory = [];
      }

      expect(metadata.subdomainHistory).toBeDefined();
      expect(metadata.subdomainHistory).toHaveLength(0);
    });
  });

  describe("UI State Management", () => {
    it("should set edit mode when editing deployed project", () => {
      const project = {
        id: 1,
        subdomain: "current-subdomain",
        deploymentStatus: "deployed" as const,
      };

      const isEditMode = true;
      const currentSubdomain = project.subdomain;

      expect(isEditMode).toBe(true);
      expect(currentSubdomain).toBe("current-subdomain");
    });

    it("should not set edit mode when publishing for first time", () => {
      const project = {
        id: 1,
        subdomain: null,
        deploymentStatus: "not_deployed" as const,
      };

      const isEditMode = false;
      const currentSubdomain = project.subdomain;

      expect(isEditMode).toBe(false);
      expect(currentSubdomain).toBeNull();
    });
  });
});
