import HybridCommand from "../../structures/HybridCommand.js";
import { imageOptions } from "../../Interactions/SlashCommands/image.js";
import { commandInput, contextImage } from "../../helpers/commandInput.js";
import { AttachmentBuilder } from "discord.js";
import sharp from "sharp";
import { ensureSupportedImageBuffer, extractFrames, inspectImage, renderAnimatedGif } from "../../helpers/gifHelper.js";

export default new HybridCommand({
  name: "vosahihai",
  slashRoute: "img vosahihai",
  options: imageOptions("vosahihai"),
  description: "He's right you know?",
  aliases: ["maisahihu"],
  usage: "vosahihai",
  guildOnly: true,
  permissions: {
    bot: [],
    user: [],
  },
  execute: async (ctx, client) => {
    const input = commandInput(ctx);
    const url = await contextImage(ctx);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    let buffer: Buffer = Buffer.from(await res.arrayBuffer());
    buffer = await ensureSupportedImageBuffer(buffer);

    const imageInfo = await inspectImage(buffer);
    const text = [
      "vo kuch thug hai",
      "vo to koi thug nahi hai",
      "vo sahi hai",
      "vo galat hai",
      "vo real hai",
      "vo sach hai",
      "vo fake hai",
      "vo <:genesis:992613277995642961> hai",
    ];
    const caption = text[Math.floor(Math.random() * text.length)];

    if (imageInfo.isAnimated) {
      const extracted = await extractFrames(buffer, 24);
      const scale = 0.5;
      const finalWidth = 540;
      const finalHeight = 428;
      const canvasDim = 540;

      const handOptions = { fit: "fill" as const, background: { r: 0, g: 0, b: 0, alpha: 0 } };
      const hand = await sharp("./Assets/vosahihai.png")
        .resize(Math.round(550 * scale), Math.round(720 * scale), handOptions)
        .png()
        .toBuffer();

      const rawFrames: Buffer[] = [];
      for (const frame of extracted.frames) {
        const head = await sharp(frame)
          .resize(Math.round(720 * scale), Math.round(800 * scale), handOptions)
          .rotate(-15, handOptions)
          .toBuffer();

        const sahi = await sharp({
          create: {
            width: canvasDim,
            height: canvasDim,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          },
        })
          .composite([
            { input: head, top: 0, left: Math.round(200 * scale) },
            { input: hand, top: Math.round(150 * scale), left: Math.round(5 * scale) },
          ])
          .resize(finalWidth, finalHeight, { position: "top" })
          .raw()
          .toBuffer();
        rawFrames.push(sahi);
      }

      const gifBuffer = await renderAnimatedGif(rawFrames, finalWidth, finalHeight, extracted.delay);
      const file = new AttachmentBuilder(gifBuffer, { name: "maisahitha.gif" });
      return ctx.reply({ content: caption, files: [file] });
    }

    const options = { fit: "fill" as const, background: { r: 0, g: 0, b: 0, alpha: 0 } };
    const head = await sharp(buffer)
      .resize(720, 800, options)
      .rotate(-15, options)
      .toBuffer();
    const hand = await sharp("./Assets/vosahihai.png")
      .resize(550, 720, options)
      .toBuffer();

    const sahi = await sharp({
      create: {
        width: 1080,
        height: 1080,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: head, top: 0, left: 200 },
        { input: hand, top: 150, left: 5 },
      ])
      .png()
      .toBuffer();
    const vosahi = await sharp(sahi)
      .resize(1080, 855, { position: "top" })
      .png()
      .toBuffer();

    const file = new AttachmentBuilder(vosahi, { name: "maisahitha.png" });
    return ctx.reply({
      content: caption,
      files: [file],
    });
  },
});
