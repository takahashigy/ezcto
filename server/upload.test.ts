import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { storagePut } from "./storage";

// Mock dependencies
vi.mock("./storage", () => ({
  storagePut: vi.fn(),
}));

describe("Image Upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should upload character image successfully", async () => {
    // Mock storage upload
    const mockUrl = "https://s3.example.com/user-uploads/1/test.png";
    const mockFileKey = "user-uploads/1/test.png";
    (storagePut as any).mockResolvedValue({ url: mockUrl });

    // Create test context
    const ctx = {
      user: { id: 1, openId: "test-user", role: "user" as const },
      req: {} as any,
      res: {} as any,
    };

    // Create caller
    const caller = appRouter.createCaller(ctx);

    // Test image upload
    const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    
    const result = await caller.upload.characterImage({
      fileName: "test.png",
      fileType: "image/png",
      base64Data: base64Image,
    });

    // Verify result
    expect(result.success).toBe(true);
    expect(result.url).toBe(mockUrl);
    expect(result.fileKey).toContain("user-uploads/1/");
    expect(storagePut).toHaveBeenCalledOnce();
  });

  it("should handle upload errors gracefully", async () => {
    // Mock storage upload failure
    (storagePut as any).mockRejectedValue(new Error("S3 upload failed"));

    const ctx = {
      user: { id: 1, openId: "test-user", role: "user" as const },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(ctx);

    const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    // Expect error to be thrown
    await expect(
      caller.upload.characterImage({
        fileName: "test.png",
        fileType: "image/png",
        base64Data: base64Image,
      })
    ).rejects.toThrow("Failed to upload image");
  });

  it("should generate unique file keys for different uploads", async () => {
    const mockUrl1 = "https://s3.example.com/user-uploads/1/file1.png";
    const mockUrl2 = "https://s3.example.com/user-uploads/1/file2.png";
    
    (storagePut as any)
      .mockResolvedValueOnce({ url: mockUrl1 })
      .mockResolvedValueOnce({ url: mockUrl2 });

    const ctx = {
      user: { id: 1, openId: "test-user", role: "user" as const },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(ctx);

    const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    // Upload twice
    const result1 = await caller.upload.characterImage({
      fileName: "test1.png",
      fileType: "image/png",
      base64Data: base64Image,
    });

    const result2 = await caller.upload.characterImage({
      fileName: "test2.png",
      fileType: "image/png",
      base64Data: base64Image,
    });

    // File keys should be different (contain timestamp and random suffix)
    expect(result1.fileKey).not.toBe(result2.fileKey);
    expect(result1.fileKey).toContain("user-uploads/1/");
    expect(result2.fileKey).toContain("user-uploads/1/");
  });

  it("should strip base64 prefix correctly", async () => {
    const mockUrl = "https://s3.example.com/user-uploads/1/test.png";
    (storagePut as any).mockResolvedValue({ url: mockUrl });

    const ctx = {
      user: { id: 1, openId: "test-user", role: "user" as const },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(ctx);

    // Test with different base64 prefixes
    const base64WithPrefix = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA==";

    await caller.upload.characterImage({
      fileName: "test.jpg",
      fileType: "image/jpeg",
      base64Data: base64WithPrefix,
    });

    // Verify storagePut was called with Buffer (base64 prefix stripped)
    expect(storagePut).toHaveBeenCalledOnce();
    const callArgs = (storagePut as any).mock.calls[0];
    expect(callArgs[1]).toBeInstanceOf(Buffer);
    expect(callArgs[2]).toBe("image/jpeg");
  });
});
