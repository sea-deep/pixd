import { AttachmentBuilder, Message } from "discord.js";
import sharp from "sharp";
import { encode } from "modern-gif";
import { getInputImage } from "../../Helpers/helpersImage.js";

export default {
  name: "goodness",
  description: "oh my goodness gracious",
  aliases: ["gracious"],
  usage: "goodness",
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
    let avatar = await sharp(Buffer.from(buffer)).resize(160, 157).toBuffer();

    // Prepare frames
    const frames = [];
    for (let i = 0; i < 34; i++) {
      const frame = i < 10 ? `0${i}` : `${i}`;
      let good = sharp(`./Assets/goodness/frame_${frame}_delay-0.05s.gif`)
        .composite([{ input: avatar, top: 139, left: 101 }]);
     const { data } = await good.raw().toBuffer({ resolveWithObject: true });
      frames.push({ data: data, delay: 50 }); // Adjust delay as needed
    }

    // Encode GIF using modern-gif
    const output = await encode({
      width: 260,
      height: 296,
      frames,
    });

    const goodness = new Blob([output], { type: "image/gif" });

    let file = new AttachmentBuilder(
      Buffer.from(await goodness.arrayBuffer()),
      { name: "goodnessgraciousness.gif" }
    );

    await message.reply({
      content: ``,
      files: [file],
    });
    await m.delete();
  },
};
