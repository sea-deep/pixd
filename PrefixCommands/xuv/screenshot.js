import { Message, AttachmentBuilder } from "discord.js";

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
      const isMobile = message.content.toLowerCase().includes('-m');

      try {
        // Make the fetch request
        const response = await fetch(`https://dd355859-026d-456f-aea3-31fc9a34ebf2-00-2r3kcsupg6yi6.pike.replit.dev/screenshot?url=${url}&mobile=${isMobile}`, {
          headers: {
            Authorization: 'Ads' // Secret password
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const imageBuffer = await response.arrayBuffer();

        // Convert image buffer to Base64
        const base64Image = Buffer.from(imageBuffer).toString('base64');

        // Create attachment from Base64 data and MIME type
        const attachment = new AttachmentBuilder('data:image/png;base64,' + base64Image, 'screenshot.png');

        await message.channel.send({ content: `Screenshot of <${url}>:`, files: [attachment] });
      } catch (error) {
        console.error('Error capturing screenshot:', error);

        // Provide informative error message
        let errorMessage = 'Failed to capture screenshot.';
        if (error.message.includes('403')) {
          errorMessage = 'Invalid secret password. Access denied.';
        } else {
          errorMessage = 'Error capturing screenshot: ' + error.message;
        }

        await message.channel.send(errorMessage);
      }
    } else {
      await message.channel.send("No valid URL provided.");
    }
  }
};