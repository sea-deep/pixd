import { AttachmentBuilder, Message } from "discord.js";
import sharp from "sharp";
import GIFEncoder from "gif-encoder-2";
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
    let avatar = await sharp(buffer).resize(252, 252).toBuffer();
    const encoder = new GIFEncoder(360, 360);
    encoder.setDelay(150);
    encoder.start();
    for (let i = 0; i < 60; i++) {
      const frame = i < 10 ? `0${i}` : `${i}`;
      let near = sharp(
        `./Assets/nearframes/frame_${frame}_delay-0.17s.gif`,
      ).composite([{ input: avatar, top: 70, left: -21 }]);
      const { data } = await near.raw().toBuffer({ resolveWithObject: true });
      encoder.addFrame(data);
    }
    encoder.finish();
    const nearYou = encoder.out.getData();
    let file = new AttachmentBuilder(nearYou, {
      name: "godnessgraciousness.gif",
    });
    await message.reply({
      content: ``,
      files: [file],
    });
    await m.delete();
  },
};
