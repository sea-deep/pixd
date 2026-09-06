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

    it("includes channel redirect and 'View in Channel' button in uploader DM", async () => {
      const dmSend = vi.fn().mockResolvedValue({});
      const fakeUser = { id: "u123", tag: "tester#0001", send: dmSend };
      const fakeClient = {
        users: {
          fetch: vi.fn().mockResolvedValue(fakeUser),
        },
        color: 0x5865f2,
      };

      const fakeUpload = {
        fileId: "0123456789ab",
        userId: "u123",
        userTag: "tester#0001",
        channelId: "c456",
        guildId: "g789",
        discordMessageId: "m101112",
        fileName: "example.png",
        fileSize: 2048,
        expiresAt: new Date(Date.now() + 6 * 3600 * 1000),
      };

      await (StorageService as any).sendUploaderDm(fakeUpload, fakeClient);

      expect(dmSend).toHaveBeenCalledOnce();
      const payload = dmSend.mock.calls[0][0];
      const embed = payload.embeds[0].data;
      expect(embed.description).toContain("<#c456>");
      expect(payload.components).toHaveLength(1);
      const buttons = payload.components[0].components;
      expect(buttons).toHaveLength(2);
      expect(buttons[0].data.label).toBe("Open File Page");
      expect(buttons[1].data.label).toBe("View in Channel");
      expect(buttons[1].data.url).toBe("https://discord.com/channels/g789/c456/m101112");
    });
  });

  describe("Web routes and security validation", () => {
    it("rejects /upload without token or with malformed token", async () => {
      // Missing token
      const noTokenRes = await fetch(`${baseUrl}/upload`);
      expect(noTokenRes.status).toBe(403);
      const noTokenText = await noTokenRes.text();
      expect(noTokenText).toContain("Invalid or Expired Upload Session");

      // Malformed token like user reported (849c1874-)
      const malformedRes = await fetch(`${baseUrl}/upload?token=849c1874-`);
      expect(malformedRes.status).toBe(403);
      const malformedText = await malformedRes.text();
      expect(malformedText).toContain("Invalid or Expired Upload Session");

      // Valid UUID format but non-existent session
      const notFoundRes = await fetch(`${baseUrl}/upload?token=00000000-0000-0000-0000-000000000000`);
      expect(notFoundRes.status).toBe(403);
    });

    it("serves upload portal page with valid active session token", async () => {
      const origKey = process.env.B2_KEY_ID;
      process.env.B2_KEY_ID = "mock_key";
      process.env.B2_APPLICATION_KEY = "mock_app_key";
      process.env.B2_BUCKET_NAME = "mock-bucket";
      process.env.B2_ENDPOINT = "https://s3.us-east-005.backblazeb2.com";

      const session = await StorageService.createSession(
        "user123",
        "user#0001",
        "chan123",
        "guild123",
        "#general",
        "Test Server"
      );
      expect(session.success).toBe(true);

      const res = await fetch(`${baseUrl}/upload?token=${session.token}`);
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain("PIXD Direct Cloud Transfer");

      // Test session-info endpoint
      const infoRes = await fetch(`${baseUrl}/api/upload/session-info?token=${session.token}`);
      expect(infoRes.status).toBe(200);
      const infoData = await infoRes.json();
      expect(infoData.success).toBe(true);
      expect(infoData.channelName).toBe("#general");
      expect(infoData.guildName).toBe("Test Server");

      // Rejects malformed token on session-info API
      const badInfoRes = await fetch(`${baseUrl}/api/upload/session-info?token=849c1874-`);
      expect(badInfoRes.status).toBe(400);

      // Verify security headers
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("x-frame-options")).toBe("DENY");

      process.env.B2_KEY_ID = origKey;
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
