import Component from "../../structures/Component.js";
import { Client } from "discord.js";
import { resolveEmbedImageUrl } from "../../helpers/helpersImage.js";

export default new Component({
  customId: "imgInputForm",
  type: "modal",
  /**
   * @param {Client} client
   */
  execute: async (interaction, client) => {
    await client.interactionDefer(interaction);
    const regex = /`([^`]+)`/;
    const matches = interaction.message.embeds[0].footer.text.match(regex);
    const total = parseInt(matches[1].split("/")[1], 10);
    const images = await client.keyv.get(interaction.message.id);
    const val = interaction.fields.getTextInputValue("input");
    const pageNumber = parseInt(val, 10);

    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > total || !images || !images[pageNumber - 1]) {
      return interaction.followUp({
        content: "",
        ephemeral: true,
        embeds: [
          {
            description: "Not a valid number!",
            color: client.color,
          },
        ],
      });
    }

    const current = parseInt(matches[1].split("/")[0], 10) - 1;
    const next = pageNumber - 1;
    const image = images[next];
    const msg = interaction.message;

    const embed = {
      title: msg.embeds[0].title,
      description: `**[${image.title}](${image.originalUrl.replace(`\\u003d`, "=")})**`,
      image: {
        url: resolveEmbedImageUrl(image),
        height: image.height,
        width: image.width,
      },
      color: client.color,
      footer: {
        text: msg.embeds[0].footer.text.replace(
          "`" + (current + 1),
          "`" + (next + 1),
        ),
      },
    };

    await interaction.message.edit({
      content: "",
      embeds: [embed],
      components: msg.components,
    });
    await client.keyv.setTTL(interaction.message.id, 30);
    await client.sleep(30500);
    if (!client.keyv.has(interaction.message.id)) {
      try {
        await interaction.message.edit({
          content: "",
          components: [],
        });
      } catch (e) {
        console.log(
          "Error while removing components in image command:",
          e instanceof Error ? e.message : String(e),
        );
      }
    }
  },
});
