import { describe, expect, it, vi, afterEach } from "vitest";
import sharp from "sharp";
import {
  tokenizeText,
  wrapTokensToLines,
  protectCustomEmojis,
  renderTextWithEmojis,
  getCustomEmojiBuffer,
  clearEmojiCache,
} from "../src/helpers/textEmojiRenderer.js";
import allustuff from "../src/HybridCommands/Image/allustuff.js";
import emiwaysay from "../src/HybridCommands/Image/emiwaysay.js";
import { Collection } from "discord.js";

afterEach(() => {
  vi.unstubAllGlobals();
  clearEmojiCache();
});

describe("textEmojiRenderer tokenizer & wrapping", () => {
  it("correctly tokenizes words, spaces, and custom emojis", () => {
    const text = "Hello <:pepe:123456789012345678> world <a:party:987654321098765432> !";
    const tokens = tokenizeText(text);

    expect(tokens.some((t) => t.type === "custom_emoji" && t.text === "<:pepe:123456789012345678>")).toBe(true);
    expect(tokens.some((t) => t.type === "custom_emoji" && t.text === "<a:party:987654321098765432>")).toBe(true);
    expect(tokens.some((t) => t.type === "space")).toBe(true);
    expect(tokens.some((t) => t.type === "word" && t.text === "Hello")).toBe(true);
  });

  it("tokenizes unicode emojis", () => {
    const text = "Fire 🔥 and ice ❄️";
    const tokens = tokenizeText(text);
    expect(tokens.some((t) => t.type === "unicode_emoji" && t.text.includes("🔥"))).toBe(true);
  });

  it("wraps tokens into lines without splitting emojis", () => {
    const text = "Short line <:emoji:123456> another line with words";
    const tokens = tokenizeText(text);
    const lines = wrapTokensToLines(tokens, 15);

    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      for (const token of line) {
        if (token.type === "custom_emoji") {
          expect(token.text).toMatch(/^<a?:[a-zA-Z0-9_]+:[0-9]+>$/);
        }
      }
    }
  });

  it("protects and restores custom emojis for translation", () => {
    const original = "I love <:heart:123456> and <a:cheer:789101> very much";
    const { protectedText, restore } = protectCustomEmojis(original);

    expect(protectedText).not.toContain("<:heart:123456>");
    expect(protectedText).toContain("__DISCORD_EMOJI_0__");
    expect(protectedText).toContain("__DISCORD_EMOJI_1__");

    // Simulate translation modifying text around placeholders
    const translated = protectedText.replace("I love", "నేను ప్రేమిస్తున్నాను");
    const restored = restore(translated);

    expect(restored).toContain("<:heart:123456>");
    expect(restored).toContain("<a:cheer:789101>");
    expect(restored).toContain("నేను ప్రేమిస్తున్నాను");
  });
});

describe("textEmojiRenderer rendering", () => {
  it("renders text containing a custom emoji with transparent alpha", async () => {
    // Generate a transparent 64x64 PNG emoji (blue circle on transparent)
    const emojiPng = await sharp({
      create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 255, alpha: 1 } },
    }).png().toBuffer();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("cdn.discordapp.com/emojis")) {
          return new Response(new Uint8Array(emojiPng), { status: 200 });
        }
        return new Response(null, { status: 404 });
      })
    );

    const rendered = await renderTextWithEmojis("Cool <:test:123456> emoji", {
      font: "Baloo 2 ExtraBold",
      fontfile: "./Assets/baloo.ttf",
      maxWidth: 500,
      textColor: "#000000",
      bgColor: "#ffffff",
      lineHeight: 60,
      emojiSize: 48,
    });

    expect(rendered).not.toBeNull();
    expect(rendered!.height).toBeGreaterThan(0);
    const meta = await sharp(rendered!.buffer).metadata();
    expect(meta.width).toBe(500);
    expect(meta.height).toBe(rendered!.height);
  });

  it("caches fetched custom emojis", async () => {
    const emojiPng = await sharp({
      create: { width: 32, height: 32, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
    }).png().toBuffer();

    const fetchMock = vi.fn().mockResolvedValue(new Response(new Uint8Array(emojiPng), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const buf1 = await getCustomEmojiBuffer("<:pepe:999999999>");
    const buf2 = await getCustomEmojiBuffer("<:pepe:999999999>");

    expect(buf1).not.toBeNull();
    expect(buf2).not.toBeNull();
    // Second call should hit in-memory cache
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("allustuff & emiwaysay integration with custom emojis", () => {
  it("allustuff renders custom emoji correctly without crashing", async () => {
    const emojiPng = await sharp({
      create: { width: 48, height: 48, channels: 4, background: { r: 0, g: 255, b: 0, alpha: 1 } },
    }).png().toBuffer();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("cdn.discordapp.com/emojis")) {
          return new Response(new Uint8Array(emojiPng), { status: 200 });
        }
        // Google Translate mock response
        if (url.includes("translate.googleapis.com")) {
          return new Response(
            JSON.stringify([
              [["హలో __DISCORD_EMOJI_0__", "hello __DISCORD_EMOJI_0__"]],
            ]),
            { status: 200 }
          );
        }
        return new Response(null, { status: 404 });
      })
    );

    const reply = vi.fn().mockResolvedValue({ id: "reply" });
    const ctx = {
      isSlash: false,
      args: ["hello", "<:allu:1122334455>"],
      user: { id: "123" },
      reply,
      raw: {
        content: "p!allustuff hello <:allu:1122334455>",
        attachments: new Collection(),
        mentions: { users: new Collection(), members: new Collection() },
        stickers: new Collection(),
        embeds: [],
      },
      options: {
        getString: () => null,
      },
    };

    await allustuff.run(ctx as any, {} as any);
    expect(reply).toHaveBeenCalled();
    const payload = reply.mock.calls.at(-1)?.[0];
    expect(payload.files).toHaveLength(1);
    const meta = await sharp(payload.files[0].attachment).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBeGreaterThan(408);
  }, 30_000);

  it("emiwaysay renders custom emoji in speech bubble", async () => {
    const emojiPng = await sharp({
      create: { width: 48, height: 48, channels: 4, background: { r: 255, g: 255, b: 0, alpha: 1 } },
    }).png().toBuffer();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("cdn.discordapp.com/emojis")) {
          return new Response(new Uint8Array(emojiPng), { status: 200 });
        }
        return new Response(null, { status: 404 });
      })
    );

    const reply = vi.fn().mockResolvedValue({ id: "reply" });
    const ctx = {
      isSlash: false,
      args: ["malum", "hai", "na", "<:bantai:55667788>"],
      user: { id: "123" },
      reply,
      raw: {
        content: "p!emiway malum hai na <:bantai:55667788>",
        attachments: new Collection(),
        mentions: { users: new Collection(), members: new Collection() },
        stickers: new Collection(),
        embeds: [],
      },
      options: {
        getString: () => null,
      },
    };

    await emiwaysay.run(ctx as any, {} as any);
    expect(reply).toHaveBeenCalled();
    const payload = reply.mock.calls.at(-1)?.[0];
    expect(payload.files).toHaveLength(1);
    const meta = await sharp(payload.files[0].attachment).metadata();
    expect(meta.width).toBe(1778);
    expect(meta.height).toBe(630);
  }, 30_000);
});
