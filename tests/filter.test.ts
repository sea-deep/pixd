import { describe, expect, it, vi } from "vitest";
import filterCommand from "../src/HybridCommands/Music/filter.js";
import { AUDIO_FILTERS, parseAudioFilter } from "../src/services/music/audioFilters.js";

describe("Audio Filters Service", () => {
  describe("parseAudioFilter", () => {
    it("returns null for empty or invalid input", () => {
      expect(parseAudioFilter(null)).toBeNull();
      expect(parseAudioFilter(undefined)).toBeNull();
      expect(parseAudioFilter("")).toBeNull();
      expect(parseAudioFilter("   ")).toBeNull();
      expect(parseAudioFilter("unknown-filter")).toBeNull();
    });

    it("parses off synonyms", () => {
      for (const val of ["off", "disable", "stop", "clear", "reset", "none", "0", "OFF", " Clear "]) {
        expect(parseAudioFilter(val)).toBe("off");
      }
    });

    it("parses bassboost synonyms", () => {
      for (const val of ["bassboost", "bass", "bb", "boost", "bassboosted", "BASS", " Bb "]) {
        expect(parseAudioFilter(val)).toBe("bassboost");
      }
    });

    it("parses slowed synonyms", () => {
      for (const val of ["slowed", "slow", "reverb", "slowedreverb", "chopped", "ambient", "SLOW"]) {
        expect(parseAudioFilter(val)).toBe("slowed");
      }
    });

    it("parses sped synonyms", () => {
      for (const val of ["sped", "spedup", "speed", "speedup", "fast", "SPED"]) {
        expect(parseAudioFilter(val)).toBe("sped");
      }
    });

    it("parses nightcore synonyms", () => {
      for (const val of ["nightcore", "nc", "NIGHTCORE", " Nc "]) {
        expect(parseAudioFilter(val)).toBe("nightcore");
      }
    });

    it("parses vaporwave synonyms", () => {
      for (const val of ["vaporwave", "vw", "vapor", "VAPORWAVE", " Vw "]) {
        expect(parseAudioFilter(val)).toBe("vaporwave");
      }
    });

    it("parses 8d synonyms", () => {
      for (const val of ["8d", "8daudio", "pan", "autopan", "8D", " 8daudio "]) {
        expect(parseAudioFilter(val)).toBe("8d");
      }
    });

    it("parses karaoke synonyms", () => {
      for (const val of ["karaoke", "vocal", "vocals", "instrumental", "removevocals", "KARAOKE"]) {
        expect(parseAudioFilter(val)).toBe("karaoke");
      }
    });

    it("parses distorted synonyms", () => {
      for (const val of ["distorted", "distort", "distortion", "crush", "earrape", "DISTORTED"]) {
        expect(parseAudioFilter(val)).toBe("distorted");
      }
    });
  });

  describe("AUDIO_FILTERS presets", () => {
    it("has all 9 presets defined with valid kind and configuration", () => {
      const keys = [
        "off",
        "bassboost",
        "slowed",
        "sped",
        "nightcore",
        "vaporwave",
        "8d",
        "karaoke",
        "distorted",
      ] as const;

      for (const key of keys) {
        const def = AUDIO_FILTERS[key];
        expect(def).toBeDefined();
        expect(def.name).toBe(key);
        expect(def.label).toBeTruthy();
        expect(def.kind).toBe("live-filter");
        if (key === "off") {
          expect(def.ffmpegArgs).toBeNull();
        } else if (key === "karaoke") {
          expect(def.ffmpegArgs).toBeInstanceOf(Array);
          expect(def.ffmpegArgs![0]).toBe("-filter_complex");
          expect(def.ffmpegArgs![2]).toBe("-map");
          expect(def.ffmpegArgs![3]).toBe("[out]");
        } else {
          expect(def.ffmpegArgs).toBeInstanceOf(Array);
          expect(def.ffmpegArgs![0]).toBe("-af");
          expect(def.ffmpegArgs![1]).toBeTruthy();
        }
      }
    });
  });

  describe("HybridCommand filter", () => {
    it("has name filter and aliases filters, fx, and fitler", () => {
      expect(filterCommand.name).toBe("filter");
      expect(filterCommand.aliases).toEqual(["filters", "fx", "fitler"]);
    });

    it("displays filter list and active filter when no argument is given", async () => {
      const mockContext = {
        guild: { id: "guild123" },
        raw: {
          client: {
            music: new Map([
              ["guild123", { filter: "bassboost" }],
            ]),
          },
        },
        options: {
          getString: vi.fn().mockReturnValue(null),
        },
        reply: vi.fn(),
      } as any;

      await (filterCommand as any).run(mockContext, {} as any);

      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("Active: **Bass Boost**"),
        })
      );
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("`bassboost`, `slowed`, `sped`, `nightcore`, `vaporwave`, `8d`, `karaoke`, `distorted`, `off`"),
        })
      );
    });

    it("sets filter and invokes player.setFilter when new filter is provided", async () => {
      const mockPlayer = {
        voiceChannelId: "vc123",
        filter: "off",
        current: { title: "Track", author: "Artist" },
        setFilter: vi.fn(),
      };

      const mockContext = {
        guild: { id: "guild123" },
        member: { voice: { channelId: "vc123" } },
        raw: {
          client: {
            music: new Map([["guild123", mockPlayer]]),
          },
        },
        options: {
          getString: vi.fn().mockReturnValue("nightcore"),
        },
        reply: vi.fn(),
      } as any;

      await (filterCommand as any).run(mockContext, {} as any);

      expect(mockPlayer.setFilter).toHaveBeenCalledWith("nightcore");
      expect(mockContext.reply).toHaveBeenCalledWith("Filter set to **Nightcore**.");
    });

    it("notifies cleanly when trying to set the same filter twice without reloading", async () => {
      const mockPlayer = {
        voiceChannelId: "vc123",
        filter: "8d",
        current: { title: "Track", author: "Artist" },
        setFilter: vi.fn(),
      };

      const mockContext = {
        guild: { id: "guild123" },
        member: { voice: { channelId: "vc123" } },
        raw: {
          client: {
            music: new Map([["guild123", mockPlayer]]),
          },
        },
        options: {
          getString: vi.fn().mockReturnValue("8d"),
        },
        reply: vi.fn(),
      } as any;

      await (filterCommand as any).run(mockContext, {} as any);

      expect(mockPlayer.setFilter).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith("Filter is already set to **8D Audio**.");
    });

    it("disables filters cleanly when 'off' is provided", async () => {
      const mockPlayer = {
        voiceChannelId: "vc123",
        filter: "distorted",
        current: null,
        setFilter: vi.fn(),
      };

      const mockContext = {
        guild: { id: "guild123" },
        member: { voice: { channelId: "vc123" } },
        raw: {
          client: {
            music: new Map([["guild123", mockPlayer]]),
          },
        },
        options: {
          getString: vi.fn().mockReturnValue("off"),
        },
        reply: vi.fn(),
      } as any;

      await (filterCommand as any).run(mockContext, {} as any);

      expect(mockPlayer.setFilter).toHaveBeenCalledWith("off");
      expect(mockContext.reply).toHaveBeenCalledWith("Filter disabled.");
    });

    it("rejects unknown filter with helpful error message", async () => {
      const mockContext = {
        guild: { id: "guild123" },
        options: {
          getString: vi.fn().mockReturnValue("alien-sound"),
        },
        reply: vi.fn(),
      } as any;

      await (filterCommand as any).run(mockContext, {} as any);

      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("Unknown filter `alien-sound`"),
        })
      );
    });
  });
});
