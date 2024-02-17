import { Message, AttachmentBuilder } from "discord.js";
import Screenshot from 'url-to-screenshot';

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
  async execute(message) {
    const urlRegex = /(?:^|\s)(https?:\/\/)?(www\.)?([^\s]+)/;
    const match = message.content.match(urlRegex);
    const isMobile = message.content.toLowerCase().includes('-m');

    if (match && match[3]) {
      const url = (match[1] ? match[1] : 'https://') + (match[2] ? match[2] : '') + match[3];

      try {
        const screenshot = new Screenshot(url);

        if (isMobile) {
          screenshot.width(320).height(480); // Set mobile dimensions
        } else {
          screenshot.width(1024).height(768); // Set default dimensions
        }

        const imgBuffer = await screenshot.capture();

        // Encode buffer to Base64
        const base64Image = Buffer.from(imgBuffer).toString('base64');

        // Create attachment from Base64 data and MIME type
        const attachment = new AttachmentBuilder('data:image/png;base64,' + base64Image, 'screenshot.png');

        await message.channel.send({ content: `Screenshot of <${url}>:`, files: [attachment] });
      } catch (error) {
        console.error('Error capturing screenshot:', error);

        // Provide informative error message
        let errorMessage = 'Failed to capture screenshot.';
        if (error.code === 'ECONNREFUSED') {
          errorMessage = 'Invalid URL or website inaccessible.';
        } else if (error.type === 'ScreenshotError') {
          errorMessage = 'Error generating screenshot: ' + error.message;
        }

        await message.channel.send(errorMessage);
      }
    } else {
      await message.channel.send("Invalid URL provided.");
    }
  }
};
