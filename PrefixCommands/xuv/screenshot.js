import { Message, AttachmentBuilder } from "discord.js-mobile";
import captureWebsite from 'capture-website';

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
  execute: async (message) => {
    const urlRegex = /(?:^|\s)(https?:\/\/)?(www\.)?([^\s]+)/;
    const match = message.content.match(urlRegex);
    const isMobile = message.content.toLowerCase().includes('-m');

    if (match && match[3]) {
      const url = (match[1] ? match[1] : 'https://') + (match[2] ? match[2] : '') + match[3];

      try {
        let screenshotBuffer;
        if (isMobile) {
          screenshotBuffer = await captureWebsite.buffer(url, { emulateDevice: 'iPhone X' });
        } else {
          screenshotBuffer = await captureWebsite.buffer(url);
        }

        await message.channel.send({ content: 'Screenshot of <' + url + '>:', files: [new AttachmentBuilder(screenshotBuffer, 'screenshot.png')] });
      } catch (error) {
        console.error('Error capturing screenshot:', error);
        await message.channel.send('Error capturing screenshot: ' + error.message);
      }
    } else {
      await message.channel.send("Invalid URL provided.");
    }
  }
};