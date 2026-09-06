import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { readFile } from "fs/promises";

describe("consolidated template GIFs & transparent image handling", () => {
  it("goodness.gif is a valid 34-frame 260x296 template", async () => {
    const buf = await readFile("./Assets/goodness.gif");
    const meta = await sharp(buf, { animated: true }).metadata();
    expect(meta.format).toBe("gif");
    expect(meta.pages).toBe(34);
    expect(meta.width).toBe(260);
    expect(meta.pageHeight).toBe(296);
  });

  it("nearyou.gif is a valid 60-frame 360x360 template", async () => {
    const buf = await readFile("./Assets/nearyou.gif");
    const meta = await sharp(buf, { animated: true }).metadata();
    expect(meta.format).toBe("gif");
    expect(meta.pages).toBe(60);
    expect(meta.width).toBe(360);
    expect(meta.pageHeight).toBe(360);
  });

  it("welcome.gif is a valid 33-frame 427x320 template", async () => {
    const buf = await readFile("./Assets/welcome.gif");
    const meta = await sharp(buf, { animated: true }).metadata();
    expect(meta.format).toBe("gif");
    expect(meta.pages).toBe(33);
    expect(meta.width).toBe(427);
    expect(meta.pageHeight).toBe(320);
  });

  it("flattens transparent PNG images against pure white #ffffff", async () => {
    // 50x50 transparent PNG with empty pixels
    const transparentPng = await sharp({
      create: { width: 50, height: 50, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).png().toBuffer();

    const flattened = await sharp(transparentPng)
      .flatten({ background: "#ffffff" })
      .resize(160, 157, { fit: "fill" })
      .raw()
      .toBuffer();

    // Check that top-left pixel is pure white (255, 255, 255)
    expect(flattened[0]).toBe(255);
    expect(flattened[1]).toBe(255);
    expect(flattened[2]).toBe(255);
  });
});
