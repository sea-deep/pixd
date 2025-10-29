
import { AttachmentBuilder, Message } from "discord.js";
import fetch from "node-fetch";

export default {
  name: "genesis",
  description: "Generate AI images",
  aliases: ["gen"],
  usage: "genesis [prompt]",
  guildOnly: false,
  args: true,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   */
  execute: async (message, args) => {
    const prompt = args.join(" ");
    const mes = await message.reply({
      content: "",
      tts: false,
      embeds: [
        {
          description: `>>> OK genesissing: **${prompt}** <a:loading:1049025849439043635>\nMight take a minute or two.`,
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 4,
              label: "STOP",
              custom_id: "delete_btn",
              disabled: false,
              emoji: {
                id: null,
                name: "🛑",
              },
            },
          ],
        },
      ],
    });

    try {
      const imageUrl = await createImage(prompt);
      const fileName = `${prompt.replace(/[^a-z0-9]/gi, "_")}.jpg`;
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Failed to fetch image from pollinations.ai");
      const imageBuffer = await response.buffer();
      const attachment = new AttachmentBuilder(imageBuffer, { name: fileName });

      const editMessageResponse = await mes.edit({
        content: "",
        embeds: [
          {
            description: `>>> Genesisation Done! \nHere is your **${prompt}**`,
            image: { url: `attachment://${fileName}` },
          },
        ],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 4,
                label: "DELETE",
                custom_id: "delete_btn",
                disabled: false,
                emoji: {
                  id: null,
                  name: "🗑️",
                },
              },
            ],
          },
        ],
        files: [attachment],
      });

      return editMessageResponse;
    } catch (e) {
      console.error(e);
      return mes.edit({
        content: "",
        embeds: [
          {
            type: "rich",
            title: `>>> Ayyo saar genesis failed :fail:`,
            description: `${e}`,
          },
        ],
        tts: false,
      });
    }
  },
};


// Use pollinations.ai free image generation API
async function createImage(prompt) {
  // Pollinations API: https://pollinations.ai/prompt/{prompt}
  // The API returns a direct image URL for the prompt
  const encodedPrompt = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}`;
}
