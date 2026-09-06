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

  it("preserves total duration when downsampling animation frames", async () => {
    // Create a 60-frame GIF with 40ms per frame (total 2400ms)
    const rawFrames: Buffer[] = [];
    for (let i = 0; i < 60; i++) {
      const f = await sharp({
        create: {
          width: 30,
          height: 30,
          channels: 4,
          background: { r: (i * 4) % 255, g: 100, b: 200, alpha: 1 },
        },
      })
        .raw()
        .toBuffer();
      rawFrames.push(f);
    }

    const origGif = await sharp(Buffer.concat(rawFrames), {
      raw: { width: 30, height: 30 * 60, channels: 4, pageHeight: 30 },
    })
      .gif({ delay: new Array(60).fill(40), loop: 0 })
      .toBuffer();

    // Downsample to 20 frames
    const extracted = await extractFrames(origGif, 20);
    expect(extracted.isAnimated).toBe(true);
    expect(extracted.frames).toHaveLength(20);

    const extractedDuration = extracted.delay.reduce((a, b) => a + b, 0);
    expect(extractedDuration).toBe(2400);

    // Render output GIF and inspect metadata
    const renderedGif = await renderAnimatedGif(
      await Promise.all(extracted.frames.map((f) => sharp(f).raw().toBuffer())),
      30,
      30,
      extracted.delay
    );
    const meta = await sharp(renderedGif, { animated: true }).metadata();
    expect(meta.pages).toBe(20);
    const outputDuration = (meta.delay || []).reduce((a, b) => a + b, 0);
    expect(outputDuration).toBe(2400);
  });

  it("pads delay array in renderAnimatedGif if fewer delays than frames are provided", async () => {
    const f1 = await sharp({
      create: { width: 20, height: 20, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
    }).raw().toBuffer();
    const f2 = await sharp({
      create: { width: 20, height: 20, channels: 4, background: { r: 0, g: 255, b: 0, alpha: 1 } },
    }).raw().toBuffer();
    const f3 = await sharp({
      create: { width: 20, height: 20, channels: 4, background: { r: 0, g: 0, b: 255, alpha: 1 } },
    }).raw().toBuffer();

    // 3 frames but only 1 delay in array [120]
    const gif = await renderAnimatedGif([f1, f2, f3], 20, 20, [120]);
    const meta = await sharp(gif, { animated: true }).metadata();
    expect(meta.pages).toBe(3);
    // Sharp should not fill trailing frames with 0; all frames should have delay 120
    expect(meta.delay).toEqual([120, 120, 120]);
  });
});
