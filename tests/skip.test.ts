import { describe, expect, it, vi } from "vitest";
import skipCommand from "../src/HybridCommands/Music/skip.js";

describe("Music Skip Command", () => {
  it("has name skip and alias next", () => {
    expect(skipCommand.name).toBe("skip");
    expect(skipCommand.aliases).toEqual(["next"]);
  });

  it("successfully skips current track and replies with track title", async () => {
    const mockTrack = {
      id: "track1",
      title: "DJ Asul - MATADORA",
      author: "EchøPhonk Lyrics",
      url: "https://youtube.com/watch?v=track1",
      durationMs: 120_000,
      requestedBy: "user1",
    };

    const mockPlayer = {
      voiceChannelId: "vc123",
      current: mockTrack,
      queue: [],
      skip: vi.fn().mockResolvedValue(mockTrack),
    };

    const mockContext = {
      guild: { id: "guild123" },
      member: { voice: { channelId: "vc123" } },
      raw: {
        client: {
          music: new Map([["guild123", mockPlayer]]),
        },
      },
      reply: vi.fn(),
    } as any;

    await (skipCommand as any).run(mockContext, {} as any);

    expect(mockPlayer.skip).toHaveBeenCalledTimes(1);
    expect(mockContext.reply).toHaveBeenCalledWith("⏭️ Skipped **DJ Asul - MATADORA**.");
  });

  it("throws clear error when nothing is currently playing and queue is empty", async () => {
    const mockPlayer = {
      voiceChannelId: "vc123",
      current: null,
      queue: [],
      skip: vi.fn().mockResolvedValue(null),
    };

    const mockContext = {
      guild: { id: "guild123" },
      member: { voice: { channelId: "vc123" } },
      raw: {
        client: {
          music: new Map([["guild123", mockPlayer]]),
        },
      },
      reply: vi.fn(),
    } as any;

    await (skipCommand as any).run(mockContext, {} as any);

    expect(mockContext.reply).toHaveBeenCalledWith({
      content: "❌ Nothing is currently playing.",
    });
  });

  it("rejects if user is not in the same voice channel", async () => {
    const mockPlayer = {
      voiceChannelId: "vc-different",
      current: { title: "Track" },
      queue: [],
      skip: vi.fn(),
    };

    const mockContext = {
      guild: { id: "guild123" },
      member: { voice: { channelId: "vc123" } },
      raw: {
        client: {
          music: new Map([["guild123", mockPlayer]]),
        },
      },
      reply: vi.fn(),
    } as any;

    await (skipCommand as any).run(mockContext, {} as any);

    expect(mockContext.reply).toHaveBeenCalledWith({
      content: "❌ Join my voice channel to control playback.",
    });
  });
});
