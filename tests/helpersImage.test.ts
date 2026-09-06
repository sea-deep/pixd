import { describe, expect, it } from "vitest";
import { getEmbedMedia, extractMediaFromMessage } from "../src/helpers/helpersImage.js";
import type { Message } from "discord.js";

describe("helpersImage media extraction", () => {
  it("extracts video embeds without requiring .gif extension", () => {
    const fakeMessage = {
      embeds: [
        {
          video: { url: "https://video.twimg.com/tweet_video/HRbOYeZXoAI1ee4.mp4" },
        },
      ],
    } as unknown as Message;

    expect(getEmbedMedia(fakeMessage)).toBe("https://video.twimg.com/tweet_video/HRbOYeZXoAI1ee4.mp4");
  });

  it("extracts image and thumbnail embeds", () => {
    const imageMsg = {
      embeds: [{ image: { url: "https://cdn.example.com/test.png" } }],
    } as unknown as Message;
    expect(getEmbedMedia(imageMsg)).toBe("https://cdn.example.com/test.png");

    const thumbMsg = {
      embeds: [{ thumbnail: { url: "https://cdn.example.com/thumb.jpg" } }],
    } as unknown as Message;
    expect(getEmbedMedia(thumbMsg)).toBe("https://cdn.example.com/thumb.jpg");
  });

  it("extractMediaFromMessage handles proxy embeds and unwraps nested media URLs", async () => {
    const fakeMessage = {
      attachments: { size: 0 },
      stickers: { size: 0 },
      content: "",
      embeds: [
        {
          video: {
            url: "https://gifconvert.vxtwitter.com/convert.avif?url=https://video.twimg.com/tweet_video/HRbOYeZXoAI1ee4.mp4",
          },
        },
      ],
    } as unknown as Message;

    const media = await extractMediaFromMessage(fakeMessage);
    expect(media).toBe("https://video.twimg.com/tweet_video/HRbOYeZXoAI1ee4.mp4");
  });

  it("extractMediaFromMessage handles custom animated emojis", async () => {
    const fakeMessage = {
      attachments: { size: 0 },
      stickers: { size: 0 },
      embeds: [],
      content: "<a:partyblob:123456789012345678>",
    } as unknown as Message;

    const media = await extractMediaFromMessage(fakeMessage);
    expect(media).toContain("https://cdn.discordapp.com/emojis/123456789012345678.gif");
  });
});
