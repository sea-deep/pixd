import { describe, expect, it, vi } from "vitest";
import piracyCommand from "../src/HybridCommands/Utility/piracy.js";

describe("piracy command", () => {
  it("has the expected command structure and metadata", () => {
    expect(piracyCommand.name).toBe("piracy");
    expect(piracyCommand.aliases).toContain("pirate");
    expect(piracyCommand.guildOnly).toBe(true);
    expect(piracyCommand.ephemeral).toBe(true);
  });

  it("handles empty results from apibay without throwing", async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "0",
          name: "No results returned",
          info_hash: "0000000000000000000000000000000000000000",
          leechers: "0",
          seeders: "0",
          size: "0",
          category: "0",
        },
      ],
    });

    try {
      let repliedText = "";
      const ctx = {
        isSlash: true,
        options: {
          getString: (name: string) => (name === "query" ? "randomnonexistentquery123" : null),
        },
        reply: (payload: any) => {
          repliedText = typeof payload === "string" ? payload : payload.content || "";
        },
        channel: { nsfw: false },
      } as any;

      await (piracyCommand.run as any)(ctx, { color: 0x2b2d31 });
      expect(repliedText).toContain("No results found");
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("handles upstream HTTP errors gracefully without crashing", async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
    });

    try {
      let repliedText = "";
      const ctx = {
        isSlash: true,
        options: {
          getString: (name: string) => (name === "query" ? "ubuntu" : null),
        },
        reply: (payload: any) => {
          repliedText = typeof payload === "string" ? payload : payload.content || "";
        },
        channel: { nsfw: false },
      } as any;

      await (piracyCommand.run as any)(ctx, { color: 0x2b2d31 });
      expect(repliedText).toContain("HTTP 502");
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("formats successful results into an embed with magnet links and seeders", async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "12345",
          name: "Ubuntu Linux ISO",
          info_hash: "2C6B6858D61DA9543D4231A71DB4B1C9264B0685",
          leechers: "4",
          seeders: "37",
          size: "3654957056",
          category: "303",
        },
      ],
    });

    try {
      let replyPayload: any = null;
      const ctx = {
        isSlash: true,
        options: {
          getString: (name: string) => (name === "query" ? "ubuntu" : null),
        },
        reply: (payload: any) => {
          replyPayload = payload;
        },
        channel: { nsfw: false },
      } as any;

      await (piracyCommand.run as any)(ctx, { color: 0x2b2d31 });
      expect(replyPayload).toBeDefined();
      expect(replyPayload.embeds).toHaveLength(1);
      const embed = replyPayload.embeds[0].data;
      expect(embed.title).toContain("ubuntu");
      expect(embed.description).toContain("Ubuntu Linux ISO");
      expect(embed.description).toContain("3.4 GB");
      expect(embed.description).toContain("37");
      expect(embed.description).toContain("magnet:?xt=urn:btih:2C6B6858D61DA9543D4231A71DB4B1C9264B0685");
      expect(replyPayload.components).toHaveLength(1);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
