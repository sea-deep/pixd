import HybridCommand from "../../structures/HybridCommand.js";
import { imageOptions } from "../../Interactions/SlashCommands/image.js";
import { commandInput, contextImage } from "../../helpers/commandInput.js";
import { AttachmentBuilder, Message } from "discord.js";
import sharp from "sharp";
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
  /**
   * @param {Message} message
   */
  execute: async (ctx, client) => {
    const input = commandInput(ctx);
    let url = await contextImage(ctx);
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    let options = { fit: "fill" as const, background: { r: 0, g: 0, b: 0, alpha: 0 } };
    let head = await sharp(buffer)
      .resize(720, 800, options)
      .rotate(-15, options)
      .toBuffer();
    let hand = await sharp("./Assets/vosahihai.png")
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

    let file = new AttachmentBuilder(vosahi, { name: "maisahitha.png" });
    let text = [
      "vo kuch thug hai",
      "vo to koi thug nahi hai",
      "vo sahi hai",
      "vo galat hai",
      "vo real hai",
      "vo sach hai",
      "vo fake hai",
      "vo <:genesis:992613277995642961> hai",
    ];
    return ctx.reply({
      content: text[Math.round(Math.random() * text.length)],
      files: [file],
    });
  },
});
