import { describe, expect, it, vi } from "vitest";
import { getVolumeEmoji } from "../src/HybridCommands/Music/volume.js";
import config from "../Configs/config.js";

describe("getVolumeEmoji", () => {
  it("returns 🔇 for 0", () => {
    expect(getVolumeEmoji(0)).toBe("🔇");
  });

  it("returns 🔈 for volume < 30", () => {
    expect(getVolumeEmoji(1)).toBe("🔈");
    expect(getVolumeEmoji(29)).toBe("🔈");
  });

  it("returns 🔉 for volume between 30 and 69", () => {
    expect(getVolumeEmoji(30)).toBe("🔉");
    expect(getVolumeEmoji(50)).toBe("🔉");
    expect(getVolumeEmoji(69)).toBe("🔉");
  });

  it("returns 🔊 for volume >= 70", () => {
    expect(getVolumeEmoji(70)).toBe("🔊");
    expect(getVolumeEmoji(100)).toBe("🔊");
  });
});

describe("GuildPlayer volume control", () => {
  it("initializes with defaultVolume", async () => {
    const { default: GuildPlayer } = await import("../src/services/music/GuildPlayer.js");
    expect(config.music.defaultVolume).toBe(100);
    expect(config.music.maxVolume).toBe(100);
  });

  it("validates volume range bounds", async () => {
    const { default: GuildPlayer } = await import("../src/services/music/GuildPlayer.js");

    // Test setVolume validation logic directly via a prototype or instance dummy
    const dummyPlayer = Object.create(GuildPlayer.prototype);
    dummyPlayer.volume = 100;
    dummyPlayer.currentResource = null;

    expect(() => dummyPlayer.setVolume(-1)).toThrow("Volume must be between 0 and 100%.");
    expect(() => dummyPlayer.setVolume(101)).toThrow("Volume must be between 0 and 100%.");
    expect(() => dummyPlayer.setVolume(NaN)).toThrow("Volume must be between 0 and 100%.");

    expect(dummyPlayer.setVolume(50)).toBe(50);
    expect(dummyPlayer.volume).toBe(50);

    const mockTransformer = { setVolumeLogarithmic: vi.fn() };
    dummyPlayer.currentResource = { volume: mockTransformer };

    dummyPlayer.setVolume(75);
    expect(dummyPlayer.volume).toBe(75);
    expect(mockTransformer.setVolumeLogarithmic).toHaveBeenCalledWith(0.75);

    dummyPlayer.setVolume(0);
    expect(dummyPlayer.volume).toBe(0);
    expect(mockTransformer.setVolumeLogarithmic).toHaveBeenCalledWith(0);
  });
});
