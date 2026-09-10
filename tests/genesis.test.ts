import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import genesisCommand from "../src/HybridCommands/XUV/genesis.js";
import { AttachmentBuilder } from "discord.js";

describe("genesis command NSFW spoilering", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Mock fetch returning a valid fake image buffer
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => Buffer.from("fake-image-data"),
    } as any);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("sends an unspoilered image and embed for a safe prompt", async () => {
    const replyMock = vi.fn();
    const ctx = {
      options: {
        getString: vi.fn().mockReturnValue("a cute little puppy running in the grass"),
      },
      user: { id: "user-123" },
      reply: replyMock,
    } as any;

    await genesisCommand.run(ctx, {} as any);

    expect(replyMock).toHaveBeenCalledOnce();
    const replyArg = replyMock.mock.calls[0][0];

    // Verify attachment
    expect(replyArg.files).toHaveLength(1);
    const file = replyArg.files[0] as AttachmentBuilder;
    expect(file.name).not.toMatch(/^SPOILER_/);
    expect((file as any).spoiler).toBeFalsy();

    // Verify embed
    expect(replyArg.embeds).toHaveLength(1);
    const embed = replyArg.embeds[0];
    expect(embed.image).toBeDefined();
    expect(embed.image?.url).toContain("attachment://");
    expect(embed.description).not.toContain("||");
  });

  it("marks output image as spoiler and omits embed image for an NSFW prompt", async () => {
    const replyMock = vi.fn();
    const ctx = {
      options: {
        getString: vi.fn().mockReturnValue("nude woman on the beach"),
      },
      user: { id: "user-456" },
      reply: replyMock,
    } as any;

    await genesisCommand.run(ctx, {} as any);

    expect(replyMock).toHaveBeenCalledOnce();
    const replyArg = replyMock.mock.calls[0][0];

    // Verify attachment is spoilered
    expect(replyArg.files).toHaveLength(1);
    const file = replyArg.files[0] as AttachmentBuilder;
    expect(file.name).toMatch(/^SPOILER_/);
    expect((file as any).spoiler).toBe(true);

    // Verify embed does NOT include direct image preview (which bypasses spoiler)
    expect(replyArg.embeds).toHaveLength(1);
    const embed = replyArg.embeds[0];
    expect(embed.image).toBeUndefined();

    // Verify prompt text in embed is spoilered
    expect(embed.description).toContain("||nude woman on the beach||");
  });
});
