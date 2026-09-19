import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import lyricsCommand from "../src/HybridCommands/Music/lyrics.js";
import { fetchLyrics } from "../src/services/music/LyricsService.js";

describe("LyricsService and lyrics command", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("fetchLyrics", () => {
    it("fetches lyrics via Genius and LRCLIB get", async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("api.genius.com")) {
          return {
            ok: true,
            json: async () => ({
              response: {
                hits: [
                  {
                    result: {
                      title: "Instant Crush",
                      primary_artist: { name: "Daft Punk" },
                      url: "https://genius.com/Daft-punk-instant-crush-lyrics",
                      song_art_image_thumbnail_url: "https://images.genius.com/thumb.png",
                    },
                  },
                ],
              },
            }),
          };
        }
        if (url.includes("lrclib.net/api/get")) {
          return {
            ok: true,
            json: async () => ({
              plainLyrics: "I didn't want to be the one to forget...",
            }),
          };
        }
        return { ok: false };
      });

      const result = await fetchLyrics("instant crush");
      expect(result).not.toBeNull();
      expect(result?.title).toBe("Instant Crush");
      expect(result?.artist).toBe("Daft Punk");
      expect(result?.lyrics).toBe("I didn't want to be the one to forget...");
      expect(result?.geniusUrl).toBe("https://genius.com/Daft-punk-instant-crush-lyrics");
      expect(result?.thumbnail).toBe("https://images.genius.com/thumb.png");
    });

    it("falls back to LRCLIB search if direct get fails", async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("lrclib.net/api/get")) {
          return { ok: false };
        }
        if (url.includes("lrclib.net/api/search")) {
          return {
            ok: true,
            json: async () => [
              {
                trackName: "Instant Crush",
                artistName: "Cage The Elephant",
                plainLyrics: "Now she's looking for a lover...",
              },
            ],
          };
        }
        return { ok: false };
      });

      const result = await fetchLyrics("instant crush");
      expect(result).not.toBeNull();
      expect(result?.title).toBe("Instant Crush");
      expect(result?.artist).toBe("Cage The Elephant");
      expect(result?.lyrics).toBe("Now she's looking for a lover...");
    });

    it("returns null if no service has lyrics", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      const result = await fetchLyrics("nonexistent song query xyz 123");
      expect(result).toBeNull();
    });
  });

  describe("lyrics HybridCommand", () => {
    it("searches lyrics for a query without requiring a voice channel", async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("lrclib.net/api/search")) {
          return {
            ok: true,
            json: async () => [
              {
                trackName: "Instant Crush",
                artistName: "Daft Punk",
                plainLyrics: "Some lyrics content here",
              },
            ],
          };
        }
        return { ok: false };
      });

      const replyMock = vi.fn();
      const ctx = {
        options: {
          getString: vi.fn().mockImplementation((name: string) => {
            if (name === "song") return "instant crush";
            return null;
          }),
        },
        args: ["instant", "crush"],
        guild: { id: "guild-1" },
        member: { voice: { channelId: null } }, // User is NOT in a voice channel!
        raw: { client: { color: 0xe08e67, music: new Map() } },
        reply: replyMock,
        followUp: vi.fn(),
      } as any;

      await lyricsCommand.run(ctx, {} as any);

      expect(replyMock).toHaveBeenCalledOnce();
      const replyArg = replyMock.mock.calls[0][0];
      expect(replyArg.embeds).toBeDefined();
      expect(replyArg.embeds[0].title).toContain("Instant Crush");
      expect(replyArg.embeds[0].description).toContain("Some lyrics content here");
    });

    it("prompts user to specify song name if nothing is playing and no query given", async () => {
      const replyMock = vi.fn();
      const ctx = {
        options: {
          getString: vi.fn().mockReturnValue(null),
        },
        args: [],
        guild: { id: "guild-1" },
        member: { voice: { channelId: null } },
        raw: { client: { color: 0xe08e67, music: new Map() } }, // Empty music map, nothing playing
        reply: replyMock,
        followUp: vi.fn(),
      } as any;

      await lyricsCommand.run(ctx, {} as any);

      expect(replyMock).toHaveBeenCalledOnce();
      const replyArg = replyMock.mock.calls[0][0];
      expect(replyArg.content).toContain("Specify a song name: `p!lyrics <song name>`");
      expect(replyArg.content).not.toContain("Join a voice channel");
    });

    it("fetches lyrics for currently playing song when no query is passed", async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("lrclib.net/api/get")) {
          return {
            ok: true,
            json: async () => ({
              plainLyrics: "Playing song lyrics",
            }),
          };
        }
        return { ok: false };
      });

      const musicMap = new Map();
      musicMap.set("guild-1", {
        current: {
          title: "Starboy",
          author: "The Weeknd",
          thumbnail: "https://example.com/starboy.jpg",
        },
      });

      const replyMock = vi.fn();
      const ctx = {
        options: {
          getString: vi.fn().mockReturnValue(null),
        },
        args: [],
        guild: { id: "guild-1" },
        member: { voice: { channelId: null } }, // User is not in VC, but bot is playing
        raw: { client: { color: 0xe08e67, music: musicMap } },
        reply: replyMock,
        followUp: vi.fn(),
      } as any;

      await lyricsCommand.run(ctx, {} as any);

      expect(replyMock).toHaveBeenCalledOnce();
      const replyArg = replyMock.mock.calls[0][0];
      expect(replyArg.embeds[0].title).toContain("Starboy");
      expect(replyArg.embeds[0].description).toBe("Playing song lyrics");
    });
  });
});
