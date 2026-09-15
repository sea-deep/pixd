import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import genesisCommand from "../src/HybridCommands/XUV/genesis.js";
import { AttachmentBuilder, PermissionsBitField } from "discord.js";
import { setChannelNsfwWhitelist } from "../src/helpers/genesisWhitelist.js";

describe("genesis command and channel-aware NSFW filtering", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Mock fetch returning a valid fake image buffer
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      arrayBuffer: async () => Buffer.from("fake-image-data"),
    } as any);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("sends an unspoilered image and passes safe=nsfw for a safe prompt in a regular channel", async () => {
    const replyMock = vi.fn();
    const ctx = {
      options: {
        getString: vi.fn().mockReturnValue("a cute little puppy running in the grass"),
      },
      user: { id: "user-123" },
      channel: { id: "chan-regular", nsfw: false },
      reply: replyMock,
    } as any;

    await genesisCommand.run(ctx, {} as any);

    expect(replyMock).toHaveBeenCalledOnce();
    const replyArg = replyMock.mock.calls[0][0];

    // Verify fetch URL contained safe=nsfw and Authorization header
    expect(global.fetch).toHaveBeenCalledOnce();
    const [calledUrl, calledOpts] = (global.fetch as any).mock.calls[0];
    expect(calledUrl).toContain("safe=nsfw");
    expect(calledOpts?.headers?.Authorization).toBeDefined();

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

  it("blocks NSFW prompts when provider returns HTTP 400 with safety error in non-NSFW channel", async () => {
    // Mock provider returning safety block error
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ "x-safety-applied": "sexual,violence" }),
      json: async () => ({
        success: false,
        error: { message: "Something was wrong with the input data, check the details for more info.", code: "BAD_REQUEST" },
        status: 400,
      }),
    } as any);

    const replyMock = vi.fn();
    const ctx = {
      options: {
        getString: vi.fn().mockReturnValue("naked woman breasts"),
      },
      user: { id: "user-456" },
      channel: { id: "chan-regular-blocked", nsfw: false },
      reply: replyMock,
    } as any;

    await genesisCommand.run(ctx, {} as any);

    expect(replyMock).toHaveBeenCalledOnce();
    const replyArg = replyMock.mock.calls[0][0];
    expect(replyArg.embeds).toHaveLength(1);
    expect(replyArg.embeds[0].title).toContain("NSFW Content Blocked");
    expect(replyArg.embeds[0].description).toContain("safety filter because this is not an NSFW channel");
  });

  it("allows NSFW prompt in an age-restricted (NSFW) channel without safe=nsfw", async () => {
    const replyMock = vi.fn();
    const ctx = {
      options: {
        getString: vi.fn().mockReturnValue("nude woman on the beach"),
      },
      user: { id: "user-nsfw-chan" },
      channel: { id: "chan-nsfw-allowed", nsfw: true },
      reply: replyMock,
    } as any;

    await genesisCommand.run(ctx, {} as any);

    expect(replyMock).toHaveBeenCalledOnce();

    // Verify fetch URL did NOT contain safe=nsfw
    const [calledUrl] = (global.fetch as any).mock.calls[0];
    expect(calledUrl).not.toContain("safe=nsfw");

    const replyArg = replyMock.mock.calls[0][0];
    // Verify attachment is spoilered
    expect(replyArg.files).toHaveLength(1);
    const file = replyArg.files[0] as AttachmentBuilder;
    expect(file.name).toMatch(/^SPOILER_/);
    expect((file as any).spoiler).toBe(true);

    // Verify prompt text in embed is spoilered
    expect(replyArg.embeds[0].description).toContain("||nude woman on the beach||");
  });

  it("allows server administrator to whitelist a non-NSFW channel and permits NSFW generation", async () => {
    const adminReplyMock = vi.fn();
    const adminCtx = {
      options: {
        getString: vi.fn().mockReturnValue("whitelist"),
      },
      user: { id: "admin-1" },
      guild: { id: "guild-1", ownerId: "owner-1" },
      channel: { id: "chan-whitelisted-1", nsfw: false },
      member: {
        permissions: new PermissionsBitField(PermissionsBitField.Flags.Administrator),
      },
      reply: adminReplyMock,
    } as any;

    await genesisCommand.run(adminCtx, {} as any);

    expect(adminReplyMock).toHaveBeenCalledOnce();
    expect(adminReplyMock.mock.calls[0][0].embeds[0].title).toContain("Channel Whitelisted for NSFW");

    // Now test generation in this whitelisted channel
    const genReplyMock = vi.fn();
    const genCtx = {
      options: {
        getString: vi.fn().mockReturnValue("nude artistic sculpture"),
      },
      user: { id: "user-gen-1" },
      guild: { id: "guild-1", ownerId: "owner-1" },
      channel: { id: "chan-whitelisted-1", nsfw: false },
      reply: genReplyMock,
    } as any;

    await genesisCommand.run(genCtx, {} as any);

    expect(genReplyMock).toHaveBeenCalledOnce();
    // Since channel is whitelisted, safe=nsfw was NOT passed
    const [calledUrl] = (global.fetch as any).mock.calls[0];
    expect(calledUrl).not.toContain("safe=nsfw");

    // Clean up whitelist
    await setChannelNsfwWhitelist("chan-whitelisted-1", false);
  });

  it("rejects non-administrators from whitelisting a channel", async () => {
    const replyMock = vi.fn();
    const ctx = {
      options: {
        getString: vi.fn().mockReturnValue("whitelist"),
      },
      user: { id: "regular-user" },
      guild: { id: "guild-1", ownerId: "different-owner" },
      channel: { id: "chan-1", nsfw: false },
      member: {
        permissions: new PermissionsBitField(), // No permissions
      },
      reply: replyMock,
    } as any;

    await genesisCommand.run(ctx, {} as any);

    expect(replyMock).toHaveBeenCalledOnce();
    expect(replyMock.mock.calls[0][0].content).toContain("Only server administrators or the server owner");
  });

  it("allows server administrator to unwhitelist a channel", async () => {
    // First whitelist
    await setChannelNsfwWhitelist("chan-to-remove", true);

    const replyMock = vi.fn();
    const ctx = {
      options: {
        getString: vi.fn().mockReturnValue("unwhitelist"),
      },
      user: { id: "admin-1" },
      guild: { id: "guild-1", ownerId: "admin-1" }, // server owner
      channel: { id: "chan-to-remove", nsfw: false },
      member: {
        permissions: new PermissionsBitField(PermissionsBitField.Flags.Administrator),
      },
      reply: replyMock,
    } as any;

    await genesisCommand.run(ctx, {} as any);

    expect(replyMock).toHaveBeenCalledOnce();
    expect(replyMock.mock.calls[0][0].embeds[0].title).toContain("NSFW Whitelist Removed");
  });
});
