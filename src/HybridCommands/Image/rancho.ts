import HybridCommand from "../../structures/HybridCommand.js";
import { AttachmentBuilder } from "discord.js";
import sharp from "sharp";
import { extractFrames, inspectImage, renderAnimatedGif } from "../../helpers/gifHelper.js";
import { resolveMultiImageTargets } from "../../helpers/targetImageResolver.js";

export default new HybridCommand({
  name: "alliswell",
  description: "Create 3 idiots poster or animated GIF",
  aliases: ["idiots", "rastogi", "farhan", "3idiots", "rancho"],
  usage: "alliswell [@users / emojis / attachments / links]",
  guildOnly: true,
  permissions: {
    bot: [],
    user: [],
  },
  options: [
    { type: 3, name: "arguments", description: "Command text and arguments, in prefix order" },
    { type: 6, name: "user", description: "Target user" },
    { type: 6, name: "user2", description: "Second target" },
    { type: 6, name: "user3", description: "Third target" },
    { type: 11, name: "image", description: "Input image or attachment" },
    { type: 11, name: "image2", description: "Second image or attachment" },
    { type: 11, name: "image3", description: "Third image or attachment" },
  ],
  execute: async (ctx, client) => {
    const avatars = await resolveMultiImageTargets(ctx, 3);
    for (let i = avatars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [avatars[i], avatars[j]] = [avatars[j], avatars[i]];
    }

    const data = [
      [
        { height: 100, width: 100, top: 427, left: 66 },
        { height: 100, width: 100, top: 446, left: 288 },
        { height: 100, width: 100, top: 416, left: 555 },
      ],
      [
        { height: 91, width: 91, top: 435, left: 90 },
        { height: 91, width: 91, top: 450, left: 294 },
        { height: 91, width: 91, top: 431, left: 538 },
      ],
      [
        { height: 176, width: 176, top: 346, left: 276 },
        { height: 143, width: 143, top: 441, left: 544 },
        { height: 176, width: 176, top: 420, left: 2 },
      ],
      [
        { height: 138, width: 138, top: 74, left: 103 },
        { height: 138, width: 138, top: 79, left: 294 },
        { height: 138, width: 138, top: 70, left: 485 },
      ],
      [
        { height: 120, width: 120, top: 255, left: 119 },
        { height: 120, width: 120, top: 274, left: 444 },
        { height: 120, width: 120, top: 261, left: 776 },
      ],
    ];

    const randIndex = Math.floor(Math.random() * 5);
    const verdict = data[randIndex];
    const templatePath = `./Assets/idiot/_${randIndex + 1}.jpg`;
    const templateMeta = await sharp(templatePath).metadata();
    const width = templateMeta.width ?? 800;
    const height = templateMeta.height ?? 600;

    const inspected = await Promise.all(avatars.map(inspectImage));
    const isAnimated = inspected.some((info) => info.isAnimated);

    const b = [
      "All is well.",
      "Aal izz well!",
      "Do not chase success. Instead, chase excellence, success will follow you.",
      "Babu Moshai Zindagi Badi Haseen Hai, Padhayi Ki Chinta Mat Karo.",
      "Success ke peeche mat bhago, excellence ke peeche bhago, success jhak maar ke tumhare peeche ayega.",
      "Life is a race, if you don't run fast, you'll be like a broken anda.",
      "Kaabil bano, duniya apne aap tumhare paas ayegi.",
      "Dil se padhai kar, success toh apne aap aayegi.",
    ];
    const line = b[Math.floor(Math.random() * b.length)];
    const options = { fit: "fill" as const };

    if (isAnimated) {
      const extractedList = await Promise.all(avatars.map((a) => extractFrames(a, 20)));
      const maxFrames = Math.max(...extractedList.map((e) => e.frames.length));
      const delay = extractedList.find((e) => e.isAnimated)?.delay ?? 100;

      const resizedByAvatar = await Promise.all(
        verdict.map(async (pos, p) => {
          const ex = extractedList[p];
          return Promise.all(
            ex.frames.map((f) =>
              sharp(f).resize(pos.width, pos.height, options).png().toBuffer()
            )
          );
        })
      );

      const bg = await sharp(templatePath).png().toBuffer();
      const rawFrames: Buffer[] = [];
      for (let f = 0; f < maxFrames; f++) {
        const a1 = resizedByAvatar[0][f % resizedByAvatar[0].length];
        const a2 = resizedByAvatar[1][f % resizedByAvatar[1].length];
        const a3 = resizedByAvatar[2][f % resizedByAvatar[2].length];

        const raw = await sharp(bg)
          .composite([
            { input: a1, top: verdict[0].top, left: verdict[0].left },
            { input: a2, top: verdict[1].top, left: verdict[1].left },
            { input: a3, top: verdict[2].top, left: verdict[2].left },
          ])
          .raw()
          .toBuffer();
        rawFrames.push(raw);
      }

      const gifBuffer = await renderAnimatedGif(rawFrames, width, height, delay);
      const file = new AttachmentBuilder(gifBuffer, { name: "idiot.gif" });
      return ctx.reply({ content: line, files: [file] });
    }

    const avatar1 = await sharp(avatars[0]).resize(verdict[0].width, verdict[0].height, options).toBuffer();
    const avatar2 = await sharp(avatars[1]).resize(verdict[1].width, verdict[1].height, options).toBuffer();
    const avatar3 = await sharp(avatars[2]).resize(verdict[2].width, verdict[2].height, options).toBuffer();

    const idiots = await sharp(templatePath)
      .composite([
        { input: avatar1, top: verdict[0].top, left: verdict[0].left },
        { input: avatar2, top: verdict[1].top, left: verdict[1].left },
        { input: avatar3, top: verdict[2].top, left: verdict[2].left },
      ])
      .png()
      .toBuffer();

    const file = new AttachmentBuilder(idiots, { name: "idiot.png" });
    return ctx.reply({
      content: line,
      files: [file],
    });
  },
});
