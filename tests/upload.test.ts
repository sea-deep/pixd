import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";
import type { Server } from "node:http";
import { formatBytes, StorageService } from "../src/services/StorageService.js";
import uploadCommand from "../src/HybridCommands/Utility/upload.js";
import { app } from "../src/services/webServer.js";
import UploadModel from "../src/models/uploadModel.js";

describe("Cloud Upload Service", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    vi.spyOn(UploadModel, "countDocuments").mockResolvedValue(0 as any);
    vi.spyOn(UploadModel, "aggregate").mockResolvedValue([{ totalBytes: 0 }] as any);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === "object") {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe("formatBytes helper", () => {
    it("formats byte values correctly", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1024 * 1024)).toBe("1 MB");
      expect(formatBytes(500 * 1024 * 1024)).toBe("500 MB");
      expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
    });
  });

  describe("Upload session lifecycle", () => {
    it("manages upload sessions correctly", async () => {
      // Mock configuration if not set in testing environment
      const origKey = process.env.B2_KEY_ID;
      const origSecret = process.env.B2_APPLICATION_KEY;
      const origBucket = process.env.B2_BUCKET_NAME;
      const origEndpoint = process.env.B2_ENDPOINT;

      process.env.B2_KEY_ID = "mock_key";
      process.env.B2_APPLICATION_KEY = "mock_app_key";
      process.env.B2_BUCKET_NAME = "mock-bucket";
      process.env.B2_ENDPOINT = "https://s3.us-east-005.backblazeb2.com";

      expect(StorageService.isConfigured()).toBe(true);

      const sessionResult = await StorageService.createSession(
        "123456789",
        "tester#0001",
        "987654321",
        "1122334455"
      );

      expect(sessionResult.success).toBe(true);
      expect(sessionResult.token).toBeDefined();
      expect(sessionResult.url).toContain(`/upload?token=${sessionResult.token}`);

      const session = StorageService.getSession(sessionResult.token!);
      expect(session).toBeDefined();
      expect(session?.userId).toBe("123456789");
      expect(session?.channelId).toBe("987654321");

      // Unknown token lookup returns null
      expect(StorageService.getSession("invalid-token-uuid")).toBeNull();

      // Restore env
      process.env.B2_KEY_ID = origKey;
      process.env.B2_APPLICATION_KEY = origSecret;
      process.env.B2_BUCKET_NAME = origBucket;
      process.env.B2_ENDPOINT = origEndpoint;
    });

    it("rejects file initiation for non-existent session", async () => {
      const result = await StorageService.initiateUpload(
        "non-existent-token",
        "test.png",
        1024,
        "image/png"
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("Session expired or invalid");
    });

    it("burns session token after initiation to prevent reuse", async () => {
      const origKey = process.env.B2_KEY_ID;
      process.env.B2_KEY_ID = "mock_key";
      process.env.B2_APPLICATION_KEY = "mock_app_key";
      process.env.B2_BUCKET_NAME = "mock-bucket";
      process.env.B2_ENDPOINT = "https://s3.us-east-005.backblazeb2.com";

      const session = await StorageService.createSession("u1", "u1tag", "c1", "g1");
      expect(session.success).toBe(true);

      vi.spyOn(UploadModel, "create").mockResolvedValue({} as any);

      const initResult = await StorageService.initiateUpload(session.token!, "file.txt", 100, "text/plain");
      expect(initResult.success).toBe(true);

      // Token should now be burned from memory
      expect(StorageService.getSession(session.token!)).toBeNull();

      // Second attempt with same token must fail
      const reuseResult = await StorageService.initiateUpload(session.token!, "file2.txt", 100, "text/plain");
      expect(reuseResult.success).toBe(false);
      expect(reuseResult.error).toContain("Session expired or invalid");

      process.env.B2_KEY_ID = origKey;
    });
  });

  describe("Hybrid Command Structure & DM Delivery", () => {
    it("has valid upload command definition and settings", () => {
      expect(uploadCommand.name).toBe("upload");
      expect(uploadCommand.category).toBe("Utility");
      expect(uploadCommand.defer).toBe(true);
      expect(uploadCommand.ephemeral).toBe(true);
      expect(uploadCommand.aliases).toContain("b2");
      expect(uploadCommand.aliases).toContain("cloud");
      expect(uploadCommand.description).toContain("1GB");
    });

    it("sends private upload link via DM for prefix commands", async () => {
      const origKey = process.env.B2_KEY_ID;
      process.env.B2_KEY_ID = "mock_key";
      process.env.B2_APPLICATION_KEY = "mock_app_key";
      process.env.B2_BUCKET_NAME = "mock-bucket";
      process.env.B2_ENDPOINT = "https://s3.us-east-005.backblazeb2.com";

      const dmSend = vi.fn().mockResolvedValue({});
      const channelReply = vi.fn().mockResolvedValue({ delete: vi.fn().mockResolvedValue({}) });

      const fakeUser = { id: "12345", tag: "tester#0001", send: dmSend };
      const fakeContext = {
        channel: { id: "chan1" },
        user: fakeUser,
        isInteraction: false,
        raw: { deletable: false },
        reply: channelReply,
      };

      await uploadCommand.run(fakeContext as any, { color: 0x5865f2 } as any);

      expect(dmSend).toHaveBeenCalledOnce();
      const dmPayload = dmSend.mock.calls[0][0];
      expect(dmPayload.embeds[0].data.title).toContain("PIXD Upload");

      expect(channelReply).toHaveBeenCalledOnce();
      expect(channelReply.mock.calls[0][0].content).toContain("Check your DMs");

      process.env.B2_KEY_ID = origKey;
    });
  });

  describe("Web routes for uploads", () => {
    it("serves upload portal page", async () => {
      const res = await fetch(`${baseUrl}/upload`);
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain("PIXD Direct Cloud Transfer");
    });

    it("validates fileId on landing page", async () => {
      const invalidRes = await fetch(`${baseUrl}/file/invalid-id`);
      expect(invalidRes.status).toBe(404);

      const validRes = await fetch(`${baseUrl}/file/0123456789ab`);
      expect(validRes.status).toBe(200);
      const text = await validRes.text();
      expect(text).toContain("PIXD • Download File");
    });
  });
});
