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
    // Extract URL from message content using a more robust regex
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const matches = message.content.match(urlRegex);

    if (matches && matches.length > 0) {
      const url = matches[0]; // First captured URL

      try {
        const screenshot = new Screenshot(url);

        // Set dimensions based on mobile flag
        const isMobile = message.content.toLowerCase().includes('-m');
        screenshot.width(isMobile ? 320 : 1024).height(isMobile ? 480 : 768);

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
      await message.channel.send("No valid URL provided.");
    }
  }
};