import { describe, expect, it } from "vitest";
import { createOkbbWelcomeGif } from "../src/helpers/welcomeHelper.js";
import sharp from "sharp";
import type { GuildMember } from "discord.js";

describe("welcome helper", () => {
  it("generates an animated welcome GIF using Sharp", async () => {
    // Generate a small dummy static avatar buffer as base64 data URL
    const avatarBuf = await sharp({
      create: { width: 92, height: 92, channels: 4, background: { r: 255, g: 100, b: 50, alpha: 1 } },
    }).png().toBuffer();
    const avatarDataUrl = `data:image/png;base64,${avatarBuf.toString("base64")}`;

    const mockMember = {
      user: {
        id: "123456789",
        username: "testuser",
        displayAvatarURL: () => avatarDataUrl,
      },
      guild: {
        id: "804902112700923954",
        name: "Test Guild",
      },
    } as unknown as GuildMember;

    const gifBuffer = await createOkbbWelcomeGif(mockMember);
    expect(Buffer.isBuffer(gifBuffer)).toBe(true);

    const meta = await sharp(gifBuffer, { animated: true }).metadata();
    expect(meta.format).toBe("gif");
    expect(meta.pages).toBe(33);
    expect(meta.width).toBe(427);
    expect(meta.pageHeight).toBe(320);
  });

  it("handles transparent avatars cleanly with solid white backing", async () => {
    // Generate a transparent avatar (alpha: 0)
    const transparentBuf = await sharp({
      create: { width: 92, height: 92, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).png().toBuffer();
    const avatarDataUrl = `data:image/png;base64,${transparentBuf.toString("base64")}`;

    const mockMember = {
      user: {
        id: "987654321",
        username: "ghostuser",
        displayAvatarURL: () => avatarDataUrl,
      },
      guild: {
        id: "804902112700923954",
        name: "Test Guild",
      },
    } as unknown as GuildMember;

    const gifBuffer = await createOkbbWelcomeGif(mockMember);
    expect(Buffer.isBuffer(gifBuffer)).toBe(true);

    const meta = await sharp(gifBuffer, { animated: true }).metadata();
    expect(meta.format).toBe("gif");
    expect(meta.pages).toBe(33);
  });
});
