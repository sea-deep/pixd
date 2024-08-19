import { AttachmentBuilder, Message } from "discord.js";
import sharp from "sharp";
import { encode } from "modern-gif";
import { getInputImage } from "../../Helpers/helpersImage.js";

export default {
  name: "nearyou",
  description: "This person lives 0kms near you.",
  aliases: ["nearme"],
  usage: "",
  guildOnly: true,
  args: false,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   */
  execute: async (message) => {
    let m = await message.reply("Processing...");
    let url = await getInputImage(message);
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

    await message.reply({
      content: ``,
      files: [file],
    });
    await m.delete();
  },
};
