import HybridCommand from "../../structures/HybridCommand.js";
import { imageOptions } from "../../Interactions/SlashCommands/image.js";
import { AttachmentBuilder } from "discord.js";
import sharp from "sharp";
import { extractFrames, inspectImage, renderAnimatedGif } from "../../helpers/gifHelper.js";
import { resolveMultiImageTargets } from "../../helpers/targetImageResolver.js";

export default new HybridCommand({
  name: "lapata",
  slashRoute: "img lapata",
  options: imageOptions("lapata"),
  description: "Create a pk lapata image or animated GIF...",
  aliases: [""],
  usage: "lapata [@users / emojis / attachments / links / 0 args]",
  guildOnly: true,
  permissions: {
    bot: [],
    user: [],
  },
  execute: async (ctx, client) => {
    const overlays = await resolveMultiImageTargets(ctx, 5, { duplicateIfSingle: true });

    const s = [
      { w: 359, h: 437, x: 145, y: 334 },
      { w: 195, h: 289, x: 938, y: 398 },
      { w: 117, h: 245, x: 1371, y: 451 },
      { w: 77, h: 206, x: 1634, y: 474 },
      { w: 59, h: 175, x: 1805, y: 477 },
    ];

    const inspected = await Promise.all(overlays.map(inspectImage));
    const isAnimated = inspected.some((info) => info.isAnimated);

    if (isAnimated) {
      const scale = 0.5;
      const width = Math.round(1928 * scale);
      const height = Math.round(1322 * scale);
      const scaledS = s.map((p) => ({
        w: Math.round(p.w * scale),
        h: Math.round(p.h * scale),
        x: Math.round(p.x * scale),
        y: Math.round(p.y * scale),
      }));

      const bgRaw = await sharp("./Assets/lapata.png")
        .resize(width, height)
        .raw()
        .toBuffer();

      const extractedList = await Promise.all(
        overlays.map((b) => extractFrames(b, 24))
      );
      const maxFrames = Math.max(...extractedList.map((e) => e.frames.length));
      const delay =
        extractedList.find((e) => e.isAnimated && e.frames.length === maxFrames)?.delay ??
        extractedList.find((e) => e.isAnimated)?.delay ??
        100;

      const resizedByPos = await Promise.all(
        scaledS.map(async (pos, p) => {
          const ex = extractedList[p];
          return Promise.all(
            ex.frames.map((f) =>
              sharp(f)
                .flatten({ background: "#ffffff" })
                .resize(pos.w, pos.h, { fit: "fill" })
                .ensureAlpha()
                .raw()
                .toBuffer()
            )
          );
        })
      );

      const rawFrames: Buffer[] = [];
      for (let f = 0; f < maxFrames; f++) {
        const composites = scaledS.map((pos, p) => {
          const posFrames = resizedByPos[p];
          const frameBuf = posFrames[f % posFrames.length];
          return {
            input: frameBuf,
            raw: { width: pos.w, height: pos.h, channels: 4 as const },
            top: pos.y,
            left: pos.x,
            blend: "dest-over" as const,
          };
        });

        const frameRaw = await sharp(bgRaw, {
          raw: { width, height, channels: 4 },
        })
          .composite(composites)
          .raw()
          .toBuffer();
        rawFrames.push(frameRaw);
      }

      const gifBuffer = await renderAnimatedGif(rawFrames, width, height, delay);
      const file = new AttachmentBuilder(gifBuffer, { name: "lapata.gif" });
      return ctx.reply({ content: "", files: [file] });
    }

    // Static rendering
    for (let i = 0; i < overlays.length; i++) {
      overlays[i] = await sharp(overlays[i])
        .flatten({ background: "#ffffff" })
        .resize(s[i].w, s[i].h, { fit: "fill" })
        .toBuffer();
    }

    const lapata = await sharp({
      create: {
        height: 1322,
        width: 1928,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: overlays[0], top: s[0].y, left: s[0].x },
        { input: overlays[1], top: s[1].y, left: s[1].x },
        { input: overlays[2], top: s[2].y, left: s[2].x },
        { input: overlays[3], top: s[3].y, left: s[3].x },
        { input: overlays[4], top: s[4].y, left: s[4].x },
        { input: "./Assets/lapata.png", top: 0, left: 0 },
      ])
      .png()
      .toBuffer();

    const file = new AttachmentBuilder(lapata, { name: "lapata.png" });
    return ctx.reply({
      content: "",
      files: [file],
    });
  },
});
