import HybridCommand from "../../structures/HybridCommand.js";
import { imageOptions } from "../../Interactions/SlashCommands/image.js";
import { AttachmentBuilder } from "discord.js";
import sharp from "sharp";
import { extractFrames, inspectImage, renderAnimatedGif } from "../../helpers/gifHelper.js";
import { resolveMultiImageTargets } from "../../helpers/targetImageResolver.js";

export default new HybridCommand({
  name: "animan",
  slashRoute: "img animan",
  options: imageOptions("animan"),
  description: "we put the new forgis on the zip",
  aliases: ["anime"],
  usage: "animan [@users / emojis / attachments / links]",
  guildOnly: true,
  permissions: {
    bot: [],
    user: [],
  },
  execute: async (ctx, client) => {
    const avatars = await resolveMultiImageTargets(ctx, 4);

    const lyrics = [
      "I put the new Forgis on the Jeep",
      "I trap until the bloody bottoms is underneath",
      "'Cause all my niggas got it out the streets",
      "I keep a hundred racks, inside my jeans",
      "I remember hittin' the mall with the whole team",
      "Now a nigga can't answer calls 'cause I'm ballin'",
      "I was wakin' up gettin' racks in the morning",
      "I was broke, now I'm rich, these niggs salty",
      "All this designer on my body got me drip, drip, ayy",
      "Straight up out the Yaadas, I'm a big Crip",
      "If I got a pint of lean, I'ma sip, sip",
      "I run the racks up with my queen like London and Nip",
      "But I got rich on all these niggas I didn't forget back",
      "I had to go through the struggle, I didn't forget that",
      "I hopped inside of the Maybach and now I can sit back",
      "These Chanel bags is a bad habit, I-I do not know how to act",
    ];
    const line = lyrics[Math.floor(Math.random() * lyrics.length)];

    const options = { fit: "fill" as const };
    const bg = await sharp("./Assets/animan.png")
      .resize(720, 762, options)
      .png()
      .toBuffer();

    const inspected = await Promise.all(avatars.map(inspectImage));
    const isAnimated = inspected.some((info) => info.isAnimated);

    const dims = [
      { w: 80, h: 80, top: 38, left: 291 },
      { w: 148, h: 144, top: 527, left: 156 },
      { w: 123, h: 112, top: 581, left: 363 },
      { w: 100, h: 110, top: 527, left: 555 },
    ];

    if (isAnimated) {
      const extractedList = await Promise.all(avatars.map((a) => extractFrames(a, 20)));
      const maxFrames = Math.max(...extractedList.map((e) => e.frames.length));
      const delay =
        extractedList.find((e) => e.isAnimated && e.frames.length === maxFrames)?.delay ??
        extractedList.find((e) => e.isAnimated)?.delay ??
        100;

      const resizedByAvatar = await Promise.all(
        dims.map(async (d, i) => {
          const ex = extractedList[i];
          return Promise.all(
            ex.frames.map((f) =>
              sharp(f).resize(d.w, d.h, options).png().toBuffer()
            )
          );
        })
      );

      const rawFrames: Buffer[] = [];
      for (let f = 0; f < maxFrames; f++) {
        const a1 = resizedByAvatar[0][f % resizedByAvatar[0].length];
        const a2 = resizedByAvatar[1][f % resizedByAvatar[1].length];
        const a3 = resizedByAvatar[2][f % resizedByAvatar[2].length];
        const a4 = resizedByAvatar[3][f % resizedByAvatar[3].length];

        const raw = await sharp({
          create: {
            width: 720,
            height: 762,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          },
        })
          .composite([
            { input: a2, top: dims[1].top, left: dims[1].left },
            { input: a3, top: dims[2].top, left: dims[2].left },
            { input: a4, top: dims[3].top, left: dims[3].left },
            { input: bg, top: 0, left: 0 },
            { input: a1, top: dims[0].top, left: dims[0].left },
          ])
          .raw()
          .toBuffer();
        rawFrames.push(raw);
      }

      const gifBuffer = await renderAnimatedGif(rawFrames, 720, 762, delay);
      const file = new AttachmentBuilder(gifBuffer, { name: "animan.gif" });
      return ctx.reply({ content: line, files: [file] });
    }

    const avatar1 = await sharp(avatars[0]).resize(dims[0].w, dims[0].h, options).toBuffer();
    const avatar2 = await sharp(avatars[1]).resize(dims[1].w, dims[1].h, options).toBuffer();
    const avatar3 = await sharp(avatars[2]).resize(dims[2].w, dims[2].h, options).toBuffer();
    const avatar4 = await sharp(avatars[3]).resize(dims[3].w, dims[3].h, options).toBuffer();

    const animan = await sharp({
      create: {
        width: 720,
        height: 762,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: avatar2, top: dims[1].top, left: dims[1].left },
        { input: avatar3, top: dims[2].top, left: dims[2].left },
        { input: avatar4, top: dims[3].top, left: dims[3].left },
        { input: bg, top: 0, left: 0 },
        { input: avatar1, top: dims[0].top, left: dims[0].left },
      ])
      .png()
      .toBuffer();

    const file = new AttachmentBuilder(animan, { name: "animan.png" });
    return ctx.reply({
      content: line,
      files: [file],
    });
  },
});
