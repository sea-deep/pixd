import { describe, expect, it, vi, afterEach } from "vitest";
import { Collection } from "discord.js";
import sharp from "sharp";
import rvcj, { parseCaptions } from "../src/HybridCommands/Image/rvcj.js";

afterEach(() => vi.unstubAllGlobals());

describe("rvcj parseCaptions", () => {
  it("parses single caption as topText", () => {
    const res = parseCaptions("Men are simple");
    expect(res).toEqual({
      topText: "Men are simple",
      bottomText: "",
      questionText: "",
    });
  });

  it("parses two captions separated by pipe", () => {
    const res = parseCaptions("Top Caption | Bottom Subtitle");
    expect(res).toEqual({
      topText: "Top Caption",
      bottomText: "Bottom Subtitle",
      questionText: "",
    });
  });

  it("parses three captions separated by pipe", () => {
    const res = parseCaptions("Top Caption | Bottom Subtitle | Yellow Question");
    expect(res).toEqual({
      topText: "Top Caption",
      bottomText: "Bottom Subtitle",
      questionText: "Yellow Question",
    });
  });

  it("supports skipping bottom subtitle with double pipe", () => {
    const res = parseCaptions("Top Caption || Yellow Question");
    expect(res).toEqual({
      topText: "Top Caption",
      bottomText: "",
      questionText: "Yellow Question",
    });
  });

  it("strips leading & and user mentions", () => {
    const res1 = parseCaptions("& Top | Bottom | Question");
    expect(res1).toEqual({
      topText: "Top",
      bottomText: "Bottom",
      questionText: "Question",
    });

    const res2 = parseCaptions("<@123456789012345678> & Top | Bottom | Question");
    expect(res2).toEqual({
      topText: "Top",
      bottomText: "Bottom",
      questionText: "Question",
    });
  });

  it("preserves ampersand inside normal sentences", () => {
    const res = parseCaptions("Tom & Jerry");
    expect(res).toEqual({
      topText: "Tom & Jerry",
      bottomText: "",
      questionText: "",
    });
  });

  it("splits by & when 3 parts are present", () => {
    const res = parseCaptions("Part 1 & Part 2 & Part 3");
    expect(res).toEqual({
      topText: "Part 1",
      bottomText: "Part 2",
      questionText: "Part 3",
    });
  });
});

describe("rvcj command rendering", () => {
  it("renders static image with 3 captions and normalizes square image to 4:3 rectangle", async () => {
    // 500x500 square image
    const squarePng = await sharp({
      create: { width: 500, height: 500, channels: 4, background: { r: 100, g: 150, b: 200, alpha: 1 } },
    }).png().toBuffer();

    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(new Uint8Array(squarePng))));

    const reply = vi.fn().mockResolvedValue({ id: "reply" });
    const image = { id: "img", url: "https://example.com/test.png" };
    const ctx = {
      isSlash: false,
      args: ["Top", "Text", "|", "Bottom", "Text", "|", "Question", "Text"],
      user: { id: "123", displayAvatarURL: () => "https://example.com/avatar.png" },
      reply,
      raw: {
        content: "p!rvcj Top Text | Bottom Text | Question Text",
        attachments: new Collection([[image.id, image]]),
        mentions: { users: new Collection(), members: new Collection() },
        stickers: new Collection(),
      },
      options: {
        getString: () => null,
        getUser: () => null,
        getMember: () => null,
        getAttachment: () => null,
      },
    };

    await rvcj.run(ctx as any, {} as any);
    expect(reply).toHaveBeenCalled();
    const payload = reply.mock.calls.at(-1)?.[0];
    expect(payload.files).toHaveLength(1);

    const attachmentBuffer = payload.files[0].attachment as Buffer;
    const meta = await sharp(attachmentBuffer).metadata();
    expect(meta.width).toBe(1080);
    // 145 header + top text + 810 (4:3 normalized height) + bottom text + question + 48 footer
    expect(meta.height).toBeGreaterThan(1000);
  }, 30_000);

  it("correctly separates multi-word captions with pipes in prefix mode even when MessageOptionResolver has positional words", async () => {
    const squarePng = await sharp({
      create: { width: 500, height: 500, channels: 4, background: { r: 100, g: 150, b: 200, alpha: 1 } },
    }).png().toBuffer();

    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(new Uint8Array(squarePng))));

    const reply = vi.fn().mockResolvedValue({ id: "reply" });
    const image = { id: "img", url: "https://example.com/test.png" };
    const ctx = {
      isSlash: false,
      args: ["ye", "le", "bhai", "tera", "energy", "drink", "|", "pee", "le", "isko", "|", "those", "who", "drink"],
      user: { id: "123", displayAvatarURL: () => "https://example.com/avatar.png" },
      reply,
      raw: {
        content: "p!rvcj ye le bhai tera energy drink | pee le isko | those who drink mother pee will only comment....",
        attachments: new Collection([[image.id, image]]),
        mentions: { users: new Collection(), members: new Collection() },
        stickers: new Collection(),
      },
      options: {
        // Simulates MessageOptionResolver assigning positional arguments to option names
        getString: (name: string) => {
          if (name === "caption") return "ye";
          if (name === "subtitle") return "le";
          if (name === "question") return "bhai";
          return null;
        },
        getUser: () => null,
        getMember: () => null,
        getAttachment: () => null,
      },
    };

    await rvcj.run(ctx as any, {} as any);
    expect(reply).toHaveBeenCalled();
    const payload = reply.mock.calls.at(-1)?.[0];
    expect(payload.files).toHaveLength(1);
  }, 30_000);

  it("renders slash command with individual caption options", async () => {
    const landscapePng = await sharp({
      create: { width: 1080, height: 600, channels: 4, background: { r: 50, g: 100, b: 150, alpha: 1 } },
    }).png().toBuffer();

    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(new Uint8Array(landscapePng))));

    const reply = vi.fn().mockResolvedValue({ id: "reply" });
    const image = { id: "img", url: "https://example.com/landscape.png" };
    const ctx = {
      isSlash: true,
      args: [],
      user: { id: "123", displayAvatarURL: () => "https://example.com/avatar.png" },
      reply,
      raw: {},
      options: {
        getString: (name: string) => {
          if (name === "caption") return "Slash Top Caption";
          if (name === "subtitle") return "Slash Subtitle";
          if (name === "question") return "DO YOU LIKE THIS?";
          return null;
        },
        getUser: () => null,
        getMember: () => null,
        getAttachment: (name: string) => (name === "image" ? image : null),
      },
    };

    await rvcj.run(ctx as any, {} as any);
    expect(reply).toHaveBeenCalled();
    const payload = reply.mock.calls.at(-1)?.[0];
    expect(payload.files).toHaveLength(1);

    const meta = await sharp(payload.files[0].attachment).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBeGreaterThan(700);
  }, 30_000);
});
