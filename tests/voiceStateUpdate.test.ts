import { describe, expect, it, vi } from "vitest";
import voiceStateUpdateEvent from "../src/events/Client/voiceStateUpdate.js";

describe("voiceStateUpdate empty channel handler", () => {
  it("has correct event configuration", () => {
    expect(voiceStateUpdateEvent.event).toBe("voiceStateUpdate");
    expect(typeof voiceStateUpdateEvent.execute).toBe("function");
  });

  it("triggers checkChannelEmpty when a user leaves the bot's voice channel", async () => {
    const checkChannelEmptyMock = vi.fn();
    const player = {
      voiceChannelId: "vc-123",
      checkChannelEmpty: checkChannelEmptyMock,
    };
    const client = {
      user: { id: "bot-id" },
      music: {
        get: vi.fn().mockReturnValue(player),
      },
    } as any;

    const oldState = {
      guild: { id: "guild-123" },
      channelId: "vc-123",
      id: "user-1",
    } as any;
    const newState = {
      guild: { id: "guild-123" },
      channelId: null,
      id: "user-1",
    } as any;

    await (voiceStateUpdateEvent.execute as any)(oldState, newState, client);

    expect(client.music.get).toHaveBeenCalledWith("guild-123");
    expect(checkChannelEmptyMock).toHaveBeenCalledOnce();
  });

  it("ignores voice state updates for unrelated channels", async () => {
    const checkChannelEmptyMock = vi.fn();
    const player = {
      voiceChannelId: "vc-123",
      checkChannelEmpty: checkChannelEmptyMock,
    };
    const client = {
      user: { id: "bot-id" },
      music: {
        get: vi.fn().mockReturnValue(player),
      },
    } as any;

    const oldState = {
      guild: { id: "guild-123" },
      channelId: "vc-other",
      id: "user-1",
    } as any;
    const newState = {
      guild: { id: "guild-123" },
      channelId: null,
      id: "user-1",
    } as any;

    await (voiceStateUpdateEvent.execute as any)(oldState, newState, client);

    expect(checkChannelEmptyMock).not.toHaveBeenCalled();
  });

  it("updates player voiceChannelId when bot is moved to a new channel", async () => {
    const checkChannelEmptyMock = vi.fn();
    const player = {
      voiceChannelId: "vc-123",
      checkChannelEmpty: checkChannelEmptyMock,
    };
    const client = {
      user: { id: "bot-id" },
      music: {
        get: vi.fn().mockReturnValue(player),
      },
    } as any;

    const oldState = {
      guild: { id: "guild-123" },
      channelId: "vc-123",
      id: "bot-id",
    } as any;
    const newState = {
      guild: { id: "guild-123" },
      channelId: "vc-456",
      id: "bot-id",
    } as any;

    await (voiceStateUpdateEvent.execute as any)(oldState, newState, client);

    expect(player.voiceChannelId).toBe("vc-456");
    expect(checkChannelEmptyMock).toHaveBeenCalledOnce();
  });

  it("checkChannelEmpty starts timer when 0 humans are present and cancels when human joins", async () => {
    vi.useFakeTimers();
    const { default: GuildPlayer } = await import("../src/services/music/GuildPlayer.js");

    const channelMembers = new Map();
    const channel = {
      isVoiceBased: () => true,
      members: {
        filter: (fn: any) => {
          const res = new Map();
          for (const [id, m] of channelMembers) {
            if (fn(m)) res.set(id, m);
          }
          return res;
        },
      },
    };

    const guild = {
      channels: { cache: new Map([["vc-123", channel]]) },
    };

    const client = {
      guilds: { cache: new Map([["guild-123", guild]]) },
      channels: { cache: new Map([["text-123", { isSendable: () => true, send: vi.fn() }]]) },
    };

    const dummyPlayer = Object.create(GuildPlayer.prototype);
    dummyPlayer.client = client;
    dummyPlayer.guildId = "guild-123";
    dummyPlayer.voiceChannelId = "vc-123";
    dummyPlayer.textChannelId = "text-123";
    dummyPlayer.destroyed = false;
    dummyPlayer.emptyChannelTimer = null;
    dummyPlayer.announce = vi.fn();
    dummyPlayer.destroy = vi.fn();

    // 1. Channel only has bot (0 humans)
    channelMembers.set("bot-1", { user: { bot: true } });
    dummyPlayer.checkChannelEmpty();

    expect(dummyPlayer.emptyChannelTimer).not.toBeNull();

    // 2. Human joins before timer expires
    channelMembers.set("human-1", { user: { bot: false } });
    dummyPlayer.checkChannelEmpty();

    expect(dummyPlayer.emptyChannelTimer).toBeNull();
    expect(dummyPlayer.destroy).not.toHaveBeenCalled();

    // 3. Human leaves, timer expires
    channelMembers.delete("human-1");
    dummyPlayer.checkChannelEmpty();
    expect(dummyPlayer.emptyChannelTimer).not.toBeNull();

    await vi.runAllTimersAsync();

    expect(dummyPlayer.destroy).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("disconnects bot from voice when no player attached and no humans remain in the channel", async () => {
    const disconnectMock = vi.fn().mockResolvedValue(undefined);
    const botMember = {
      voice: {
        channel: {
          id: "vc-123",
          name: "Music Room",
          members: new Map([
            ["bot-1", { user: { bot: true } }],
          ]),
        },
        disconnect: disconnectMock,
      },
    };

    const guild = {
      name: "Test Guild",
      members: { me: botMember },
    };

    const client = {
      user: { id: "bot-1" },
    } as any;

    const oldState = {
      guild,
      channelId: "vc-123",
      id: "human-1",
    } as any;
    const newState = {
      guild,
      channelId: null,
      id: "human-1",
    } as any;

    await (voiceStateUpdateEvent.execute as any)(oldState, newState, client);

    expect(disconnectMock).toHaveBeenCalledOnce();
  });
});

