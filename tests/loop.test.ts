import { describe, expect, it, vi } from "vitest";
import loopCommand from "../src/HybridCommands/Music/loop.js";

describe("Music Loop Command (Toggle)", () => {
  it("has aliases repeat and l, with no required options", () => {
    expect(loopCommand.name).toBe("loop");
    expect(loopCommand.aliases).toEqual(["repeat", "l"]);
    expect(loopCommand.options?.length ?? 0).toBe(0);
  });

  it("toggles loop mode from off to track (enabled)", async () => {
    const mockPlayer = {
      voiceChannelId: "vc123",
      loopMode: "off",
      setLoopMode: vi.fn((m) => {
        mockPlayer.loopMode = m;
      }),
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

    await (loopCommand as any).run(mockContext, {} as any);

    expect(mockPlayer.setLoopMode).toHaveBeenCalledWith("track");
    expect(mockContext.reply).toHaveBeenCalledWith(
      expect.stringContaining("Looping is now **enabled**")
    );
  });

  it("toggles loop mode from track to off (disabled)", async () => {
    const mockPlayer = {
      voiceChannelId: "vc123",
      loopMode: "track",
      setLoopMode: vi.fn((m) => {
        mockPlayer.loopMode = m;
      }),
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

    await (loopCommand as any).run(mockContext, {} as any);

    expect(mockPlayer.setLoopMode).toHaveBeenCalledWith("off");
    expect(mockContext.reply).toHaveBeenCalledWith(
      expect.stringContaining("Looping is now **disabled**")
    );
  });
});
