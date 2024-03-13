import { AttachmentBuilder, Message } from "discord.js";
import sharp from "sharp";
import { getInputImage } from "../../Helpers/helpersImage.js";
export default {
  name: "rape",
  description: "rape",
  aliases: ["nirbhaya"],
  usage: "rape",
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
    const allCords = [
      { x: 0, y: 0 },
      { x: 366, y: 0 },
      { x: 0, y: 500 },
      { x: 366, y: 500 },
    ];
    const position = allCords[Math.floor(Math.random() * 4)];
    let url = await getInputImage(message);
    const res = fetch(url);
    const buffer = await res.arrayBuffer();
    const avatar = await sharp(buffer).resize(366, 500, {fit: "fill"}).toBuffer();
    const rapper = await sharp("./Assets/rap.jpg")
      .resize(732, 1000)
      .composite([
        {
          input: {
            create: {
              width: 366,
              height: 500,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 1 },
            },
          },
        },
        { input: avatar, top: position.y, left: position.x },
      ])
      .png()
      .toBuffer();
    let file = new AttachmentBuilder(rapper, { name: "nirbhaya.png" });
    await message.channel.send({
      content: "",
      files: [file],
    });
  },
};
