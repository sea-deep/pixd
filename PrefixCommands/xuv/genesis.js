import { AttachmentBuilder, Message } from "discord.js";

export default {
  name: "genesis",
  description: "Generate AI images",
  aliases: ["imagine"],
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
    const prompt = args.join(' ');

    if (!prompt) {
      return message.reply('❌ **Please provide something for genesis.**');
    }

    const mes = await message.reply({
      content: `>>> OK genesissing: **${prompt}** <a:loading:1049025849439043635>\nMight take a minute or two.`,
      tts: false,
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 4,
              label: 'STOP',
              custom_id: 'delete_btn',
              disabled: false,
              emoji: {
                id: null,
                name: '🛑',
              },
            },
          ],
        },
      ],
    });

    try {
      const imageBuffer = await createImage(prompt);
      const fileName = `${prompt}.jpg`;
      const attachment = new AttachmentBuilder(imageBuffer, { name: fileName });

      const editMessageResponse = await mes.edit({
        content: `>>> Genesisation Done! \nHere is your **${prompt}**`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 4,
                label: 'DELETE',
                custom_id: 'delete_btn',
                disabled: false,
                emoji: {
                  id: null,
                  name: '🗑️',
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
        content: `>>> Ayyo saar genesis failed :fail:`,
        embed: { type: 'rich', description: `${e}` },
        tts: false,
      });
    }
  },
};

async function createImage(prompt) {
  const payload = {
    cfg_scale: 7,
    clip_guidance_preset: "FAST_BLUE",
    weight: 1,
    sampler: "K_DPM_2_ANCESTRAL",
    samples: 1,
    prompt: `${prompt}, hyper realistic, high resolution 4k quality`,
    steps: 100,
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.SD_TOKEN}`,
  };

  try {
    const response = await fetch("https://api.wizmodel.com/sdapi/v1/txt2img", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (responseData.images.length > 0) {
      const image = responseData.images[0];
      const data = image.replace(/^data:image\/\w+;base64,/, "");
      return Buffer.from(data, "base64");
    } else {
      throw new Error("No images found in the response.");
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}