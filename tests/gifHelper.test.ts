import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  extractFrames,
  inspectImage,
  renderAnimatedGif,
  resolveMediaUrl,
} from "../src/helpers/gifHelper.js";

describe("gifHelper", () => {
  it("resolves direct media URLs without querying network", async () => {
    const urls = [
      "https://cdn.discordapp.com/attachments/123/456/sample.gif",
      "https://cdn.discordapp.com/attachments/123/456/sample.gif?ex=66e&is=66c&hm=abc",
      "https://example.com/test.png",
      "https://example.com/test.webp?width=500",
    ];
    for (const u of urls) {
      expect(await resolveMediaUrl(u)).toBe(u);
    }
  });

  it("inspects static images properly", async () => {
    const staticBuf = await sharp({
      create: {
        width: 120,
        height: 80,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const info = await inspectImage(staticBuf);
    expect(info.isAnimated).toBe(false);
    expect(info.width).toBe(120);
    expect(info.height).toBe(80);
    expect(info.pages).toBe(1);
  });

  it("inspects animated GIFs and detects frame count and pageHeight", async () => {
    const f1 = await sharp({
      create: { width: 60, height: 40, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
    }).raw().toBuffer();
    const f2 = await sharp({
      create: { width: 60, height: 40, channels: 4, background: { r: 0, g: 255, b: 0, alpha: 1 } },
    }).raw().toBuffer();

    const animGif = await sharp(Buffer.concat([f1, f2]), {
      raw: { width: 60, height: 80, channels: 4, pageHeight: 40 },
    })
      .gif({ delay: [100, 150], loop: 0 })
      .toBuffer();

    const info = await inspectImage(animGif);
    expect(info.isAnimated).toBe(true);
    expect(info.pages).toBe(2);
    expect(info.width).toBe(60);
    expect(info.pageHeight).toBe(40);
  });

  it("extracts frames correctly from static and animated images", async () => {
    const staticBuf = await sharp({
      create: { width: 50, height: 50, channels: 4, background: { r: 0, g: 0, b: 255, alpha: 1 } },
    }).png().toBuffer();

    const staticExtracted = await extractFrames(staticBuf);
    expect(staticExtracted.isAnimated).toBe(false);
    expect(staticExtracted.frames).toHaveLength(1);

    const f1 = await sharp({
      create: { width: 50, height: 50, channels: 4, background: { r: 10, g: 20, b: 30, alpha: 1 } },
    }).raw().toBuffer();
    const f2 = await sharp({
      create: { width: 50, height: 50, channels: 4, background: { r: 40, g: 50, b: 60, alpha: 1 } },
    }).raw().toBuffer();

    const animGif = await sharp(Buffer.concat([f1, f2]), {
      raw: { width: 50, height: 100, channels: 4, pageHeight: 50 },
    })
      .gif({ delay: 80, loop: 0 })
      .toBuffer();

    const animExtracted = await extractFrames(animGif, 10);
    expect(animExtracted.isAnimated).toBe(true);
    expect(animExtracted.frames).toHaveLength(2);
    expect(animExtracted.width).toBe(50);
    expect(animExtracted.height).toBe(50);
  });

  it("renders multiple raw frames into an animated GIF", async () => {
    const f1 = await sharp({
      create: { width: 40, height: 40, channels: 4, background: { r: 255, g: 100, b: 50, alpha: 1 } },
    }).raw().toBuffer();
    const f2 = await sharp({
      create: { width: 40, height: 40, channels: 4, background: { r: 50, g: 100, b: 255, alpha: 1 } },
    }).raw().toBuffer();

    const gif = await renderAnimatedGif([f1, f2], 40, 40, [100, 200]);
    expect(gif).toBeInstanceOf(Buffer);

    const meta = await sharp(gif, { animated: true }).metadata();
    expect(meta.format).toBe("gif");
    expect(meta.pages).toBe(2);
    expect(meta.width).toBe(40);
    expect(meta.pageHeight).toBe(40);
  });
});
