import fetch from "node-fetch";
import { AttachmentBuilder, Message } from "discord.js";

export default {
  name: "screenshot",
  description: "Captures a screenshot of the specified website.",
  aliases: ["ss"],
  usage: "!screenshot <URL> [-m]",
  guildOnly: true,
  args: false,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   */
  async execute(message) {
    await message.channel.sendTyping();
    const text = message.content;
    const urlPattern = /(https?:\/\/)?(www\.)?(\w+\.\w+)/g;
    const urls = text.match(urlPattern);

    if (!urls || urls.length === 0) {
      return message.reply({
        content: "",
        embeds: [{
          description: "❎| **Please give a valid url**",
          color: 0xe08e67
        }]
      });
    }

    let url = urls[0].trim()
      .toLowerCase()
      .replace(/^(https?:\/\/)?/, "https://")
      .replace(/^https?:\/\/(www\.)?/, "https://");
    const isMobile = message.content.toLowerCase().includes('-m');

      const response = await fetch(`https://fetch-ss.onrender.com/screenshot?url=${url}&mobile=${isMobile}&password=${process.env.SS_PASS}`);

      if (!response.ok) {
        return message.reply({
          content: "",
          embeds: [{
            description: "❎ | **An error occurred while capturing screenshot**",
            color: 0xe08e67
          }]
        });
      }

      const imageBuffer = await response.arrayBuffer();
      const ss = Buffer.from(imageBuffer);
      const attachment = new AttachmentBuilder(ss, 'screenshot.png');

      await message.channel.send({
        content: '', files: [attachment], embeds: [{
          description: `**Screenshot for: _${url}_**`, color: 0xe08e67
        }]
      });
  }
};