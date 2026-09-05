import HybridCommand from "../../structures/HybridCommand.js";
import { imageOptions } from "../../Interactions/SlashCommands/image.js";
import { commandInput, contextImage } from "../../helpers/commandInput.js";
import { AttachmentBuilder, Message } from "discord.js";
import sharp from "sharp";
import { encode } from "modern-gif";

export default new HybridCommand({
  name: "nearyou",
  slashRoute: "img nearyou",
  options: imageOptions("nearyou"),
  description: "This person lives 0kms near you.",
  aliases: ["nearme"],
  usage: "",
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
    let res = await fetch(url);
    let buffer = await res.arrayBuffer();
    let avatar = await sharp(Buffer.from(buffer)).resize(252, 252).toBuffer();

    // Prepare frames
    const frames = [];
    for (let i = 0; i < 60; i++) {
      const frame = i < 10 ? `0${i}` : `${i}`;
      let near = sharp(`./Assets/nearframes/frame_${frame}_delay-0.17s.gif`)
        .composite([{ input: avatar, top: 70, left: -21 }]);

        const { data } = await near.raw().toBuffer({ resolveWithObject: true });
      frames.push({ data: data, delay: 150 }); // Adjust delay as needed
    }

    // Encode GIF using modern-gif
    const output = await encode({
      width: 360,
      height: 360,
      frames,
    });

    const nearYou = new Blob([output], { type: "image/gif" });

    let file = new AttachmentBuilder(
      Buffer.from(await nearYou.arrayBuffer()),
      { name: "nearyou.gif" }
    );

    await ctx.reply({
      content: ``,
      files: [file],
    });
  },
});
