import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import {
  getTwemojiUrl,
  fetchImageBuffer,
  resolveMultiImageTargets,
} from "../src/helpers/targetImageResolver.js";
import { Collection } from "discord.js";

describe("targetImageResolver", () => {
  it("generates correct Twemoji CDN URLs for unicode emojis", () => {
    expect(getTwemojiUrl("🗿")).toBe(
      "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f5ff.png"
    );
    expect(getTwemojiUrl("💀")).toBe(
      "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f480.png"
    );
    // Strips variation selector-16 (fe0f)
    expect(getTwemojiUrl("❤️")).toBe(
      "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/2764.png"
    );
  });

  it("handles fetchImageBuffer gracefully on invalid URL or failure", async () => {
    const result = await fetchImageBuffer("https://non-existent-domain-404-xyz.com/image.png");
    expect(result).toBeNull();
  });

  it("resolves multi-image targets with cyclic duplication and author fallback", async () => {
    // Generate a valid PNG buffer to use as mock avatar
    const samplePng = await sharp({
      create: { width: 32, height: 32, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
    })
      .png()
      .toBuffer();

    const mockUser = {
      id: "999000111222333444",
      displayAvatarURL: () => "https://mock.cdn/avatar.png",
    };

    const mockCtx: any = {
      isSlash: false,
      user: mockUser,
      args: [],
      client: {
        user: { id: "bot-123" },
        users: {
          cache: new Map([["999000111222333444", mockUser]]),
          fetch: vi.fn().mockResolvedValue(mockUser),
        },
      },
      raw: {
        id: "msg-1",
        content: "p!rancho",
        mentions: { users: new Collection(), members: new Collection() },
        attachments: new Collection(),
      },
      channel: {
        messages: {
          fetch: vi.fn().mockResolvedValue(new Collection()),
        },
      },
    };

    // Mock global fetch to return our samplePng
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => samplePng.buffer,
    }) as any;

    try {
      const targets = await resolveMultiImageTargets(mockCtx, 3);
      expect(targets).toHaveLength(3);
      expect(Buffer.isBuffer(targets[0])).toBe(true);
      expect(Buffer.isBuffer(targets[1])).toBe(true);
      expect(Buffer.isBuffer(targets[2])).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("falls back to recent channel messages when run without inputs", async () => {
    const samplePng = await sharp({
      create: { width: 32, height: 32, channels: 4, background: { r: 0, g: 255, b: 0, alpha: 1 } },
    })
      .png()
      .toBuffer();

    const userA = { id: "user-A", displayAvatarURL: () => "https://mock.cdn/userA.png" };
    const userB = { id: "user-B", displayAvatarURL: () => "https://mock.cdn/userB.png" };
    const userC = { id: "user-C", displayAvatarURL: () => "https://mock.cdn/userC.png" };

    const recentMessages = new Collection([
      ["msg-3", { id: "msg-3", author: userA }],
      ["msg-2", { id: "msg-2", author: userB }],
      ["msg-1", { id: "msg-1", author: userC }],
    ]);

    const mockCtx: any = {
      isSlash: false,
      user: { id: "author-user", displayAvatarURL: () => "https://mock.cdn/author.png" },
      args: [],
      client: {
        user: { id: "bot-client-id" },
        users: {
          cache: new Map(),
          fetch: vi.fn(),
        },
      },
      raw: {
        id: "cmd-msg",
        content: "p!animan",
        mentions: { users: new Collection(), members: new Collection() },
        attachments: new Collection(),
      },
      channel: {
        messages: {
          fetch: vi.fn().mockResolvedValue(recentMessages),
        },
      },
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => samplePng.buffer,
    }) as any;

    try {
      const targets = await resolveMultiImageTargets(mockCtx, 4);
      expect(targets).toHaveLength(4);
      // Verify channel messages were fetched
      expect(mockCtx.channel.messages.fetch).toHaveBeenCalledWith({ limit: 50 });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("duplicates single explicit target across all slots when duplicateIfSingle is enabled", async () => {
    const samplePng = await sharp({
      create: { width: 32, height: 32, channels: 4, background: { r: 0, g: 0, b: 255, alpha: 1 } },
    })
      .png()
      .toBuffer();

    const mockCtx: any = {
      isSlash: false,
      user: { id: "author-user", displayAvatarURL: () => "https://mock.cdn/author.png" },
      args: ["<:cool:1122334455>"],
      client: {
        user: { id: "bot-client-id" },
        users: { cache: new Map(), fetch: vi.fn() },
      },
      raw: {
        id: "cmd-msg",
        content: "p!lapata <:cool:1122334455>",
        mentions: { users: new Collection(), members: new Collection() },
        attachments: new Collection(),
      },
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => samplePng.buffer,
    }) as any;

    try {
      const targets = await resolveMultiImageTargets(mockCtx, 5, { duplicateIfSingle: true });
      expect(targets).toHaveLength(5);
      // All 5 buffers should be identical (duplicated single target)
      expect(targets[0]).toEqual(targets[1]);
      expect(targets[1]).toEqual(targets[4]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
