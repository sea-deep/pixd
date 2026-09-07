import { describe, expect, it } from "vitest";
import YtDlpResolver from "../src/services/music/YtDlpResolver.js";

describe("Multi-Source Music Resolver & Fallback Pipeline", () => {
  const resolver = new YtDlpResolver();

  describe("Prefix Parsing & Routing", () => {
    it("recognizes sc: and soundcloud: prefixes and sets source to soundcloud", async () => {
      const result = await resolver.resolve("sc:MATADORA", "test-user");
      expect(result.tracks.length).toBeGreaterThan(0);
      expect(result.source).toBe("soundcloud");
      expect(result.tracks[0].source).toBe("soundcloud");
      expect(result.tracks[0].url).toContain("soundcloud.com");
    }, 15000);

    it("rejects empty query after prefix", async () => {
      await expect(resolver.resolve("sc:   ", "test-user")).rejects.toThrow(
        "Provide a song name or search query after the prefix."
      );
    });
  });

  describe("SoundCloud Live Fallback", () => {
    it("finds a live fallback track on SoundCloud", async () => {
      const fallback = await resolver.findSoundCloudFallback("Never Gonna Give You Up", "Rick Astley");
      expect(fallback).not.toBeNull();
      expect(fallback?.url).toContain("soundcloud.com");
      expect(fallback?.source).toBe("soundcloud");
    }, 15000);
  });

  describe("Spotify Track Resolution", () => {
    it("resolves a public Spotify track link using oEmbed and searches across providers", async () => {
      // Rick Astley - Never Gonna Give You Up
      const spotifyUrl = "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT";
      const result = await resolver.resolve(spotifyUrl, "test-user");
      expect(result.tracks.length).toBeGreaterThan(0);
      expect(result.source).toBe("spotify");
      expect(result.tracks[0].source).toBe("spotify");
      expect(result.tracks[0].title.toLowerCase()).toContain("never gonna give you up");
    }, 20000);
  });

  describe("Automatic Fallback", () => {
    it("resolves queries in auto mode and returns a playable track", async () => {
      const result = await resolver.resolve("Chahunga Main Tujhe Hardam", "test-user", "auto");
      expect(result.tracks.length).toBeGreaterThan(0);
      expect(["youtube", "soundcloud"]).toContain(result.source);
    }, 20000);
  });
});
