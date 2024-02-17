import { Message } from "discord.js";
import webshot from 'webshot';

export default {
  name: "screenshot",
  description: "Captures a screenshot of the specified website.",
  aliases: ["ss"],
  usage: "screenshot <URL> [-m]",
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
      let options = {};

      if (isMobile) {
        options = {
          screenSize: {
            width: 320,
            height: 480
          },
          shotSize: {
            width: 320,
            height: 'all'
          },
          userAgent: 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.20 (KHTML, like Gecko) Mobile/7B298g'
        };
      }

      try {
        const renderStream = await webshot(url, { streamType: 'png', ...options });

        renderStream.on('data', async function (data) {
          const attachment = new AttachmentBuilder(data, 'screenshot.png');
          await message.channel.send({content: 'Screenshot of <' + url + '>:', files: [ attachment ]});
        });
      } catch (error) {
        console.error('Error capturing screenshot:', error);
        await message.channel.send('Error capturing screenshot: ' + error.message);
      }
    } else {
      await message.channel.send("Invalid URL provided.");
    }
  }
};