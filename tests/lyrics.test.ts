import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import lyricsCommand from "../src/HybridCommands/Music/lyrics.js";
import lyricsButton from "../src/Interactions/Buttons/Music/lyrics.js";
import {
  fetchLyrics,
  formatLyrics,
  chunkLyrics,
  cacheLyrics,
  getCachedLyrics,
} from "../src/services/music/LyricsService.js";

describe("LyricsService, lyrics command, and ephemeral button", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("formatLyrics and chunkLyrics", () => {
    it("formats stanzas with blockquotes and bold headers", () => {
      const raw = "[Verse 1]\nLine 1\nLine 2\n\n[Chorus]\nLine 3\nLine 4";
      const formatted = formatLyrics(raw);
      expect(formatted).toContain("**[Verse 1]**\n> Line 1\n> Line 2");
      expect(formatted).toContain("**[Chorus]**\n> Line 3\n> Line 4");
    });

    it("chunks long lyrics preserving stanzas", () => {
      const stanza1 = "Stanza 1 line 1\nStanza 1 line 2";
      const stanza2 = "Stanza 2 line 1\nStanza 2 line 2";
      const combined = `${stanza1}\n\n${stanza2}`;
      const chunks = chunkLyrics(combined, 35);
      expect(chunks.length).toBe(2);
      expect(chunks[0]).toBe(stanza1);
      expect(chunks[1]).toBe(stanza2);
    });

    it("caches and retrieves lyrics correctly", () => {
      const id = cacheLyrics({
        title: "Test Track",
        lyrics: "Test Lyrics",
      });
      const cached = getCachedLyrics(id);
      expect(cached).not.toBeNull();
      expect(cached?.title).toBe("Test Track");
      expect(cached?.lyrics).toBe("Test Lyrics");
    });
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
    it("renders a compact preview card with a View Lyrics button instead of a text wall", async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("lrclib.net/api/search")) {
          return {
            ok: true,
            json: async () => [
              {
                trackName: "Instant Crush",
                artistName: "Daft Punk",
                plainLyrics: "Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7",
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
        member: { voice: { channelId: null } }, // User is NOT in a voice channel
        raw: { client: { color: 0xe08e67, music: new Map() } },
        reply: replyMock,
        followUp: vi.fn(),
      } as any;

      await lyricsCommand.run(ctx, {} as any);

      expect(replyMock).toHaveBeenCalledOnce();
      const replyArg = replyMock.mock.calls[0][0];
      expect(replyArg.embeds).toBeDefined();
      expect(replyArg.embeds[0].title).toContain("Instant Crush");

      // Verify it does NOT contain the full lyrics wall (only preview)
      expect(replyArg.embeds[0].description).toContain("Click the button below to view the full lyrics");
      expect(replyArg.embeds[0].description).not.toContain("Line 7");

      // Verify button components are attached
      expect(replyArg.components).toBeDefined();
      expect(replyArg.components).toHaveLength(1);
      const button = replyArg.components[0].components[0];
      expect(button.data.label).toBe("View Lyrics");
      expect(button.data.custom_id).toMatch(/^lyrics-view:/);
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
        raw: { client: { color: 0xe08e67, music: new Map() } },
        reply: replyMock,
        followUp: vi.fn(),
      } as any;

      await lyricsCommand.run(ctx, {} as any);

      expect(replyMock).toHaveBeenCalledOnce();
      const replyArg = replyMock.mock.calls[0][0];
      expect(replyArg.content).toContain("Specify a song name: `p!lyrics <song name>`");
      expect(replyArg.content).not.toContain("Join a voice channel");
    });
  });

  describe("lyrics-view button interaction", () => {
    it("responds ephemerally with formatted lyrics", async () => {
      const cacheId = cacheLyrics({
        title: "Instant Crush",
        artist: "Daft Punk",
        lyrics: "I didn't want to be the one to forget\nI thought of everything I'd never regret\n\nOne thing I never see the same",
      });

      const deferReplyMock = vi.fn();
      const editReplyMock = vi.fn();

      const interaction = {
        deferReply: deferReplyMock,
        editReply: editReplyMock,
        followUp: vi.fn(),
        message: { embeds: [] },
      } as any;

      await lyricsButton.execute(interaction, {} as any, cacheId);

      // Verify ephemeral deferral
      expect(deferReplyMock).toHaveBeenCalledWith({ flags: 64 });

      // Verify editReply received formatted blockquote lyrics
      expect(editReplyMock).toHaveBeenCalledOnce();
      const replyArg = editReplyMock.mock.calls[0][0];
      expect(replyArg.embeds[0].title).toContain("Instant Crush");
      expect(replyArg.embeds[0].description).toContain("> I didn't want to be the one to forget");
      expect(replyArg.embeds[0].description).toContain("> One thing I never see the same");
    });
  });
});
