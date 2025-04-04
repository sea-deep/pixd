import { ChatInputCommandInteraction } from "discord.js";

export default {
  data: {
    name: "help",
    description: "Get some help.",
  },
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  execute: async (interaction, client) => {
    return interaction.reply({
      content: `-# /help`,
      tts: false,
      components: [
        {
          type: 1,
          components: [
            {
              custom_id: "cmd",
              placeholder: `Select Category`,
              options: [
                {
                  label: `2047 AI Technology`,
                  value: `xuv`,
                  description: `Top 10 ai gadgets that will change ur life 🤫🤫🤫`,
                  emoji: {
                    id: `1084739827167154176`,
                    name: `XUV`,
                    animated: false,
                  },
                  default: false,
                },
                {
                  label: `Helpful Utilities`,
                  value: `uti`,
                  description: `Utility commands only found within this bot.`,
                  emoji: {
                    id: `1219696858339737761`,
                    name: `typing`,
                    animated: false,
                  },
                  default: false,
                },
                {
                  label: `Music`,
                  value: `son`,
                  description: `Op supar high quality music `,
                  emoji: {
                    id: `1084743885063991346`,
                    name: `music`,
                    animated: false,
                  },
                  default: false,
                },
                {
                  label: `Image Generation`,
                  value: `img`,
                  description: `Create fanny images`,
                  emoji: {
                    id: `1084741002339831839`,
                    name: `joyful`,
                    animated: false,
                  },
                  default: false,
                },
                {
                  label: `Mini-games`,
                  value: `gam`,
                  description: `Some chotte motte games.`,
                  emoji: {
                    id: `1116349246732521472`,
                    name: `minigames`,
                    animated: false,
                  },
                  default: false,
                },
              ],
              min_values: 0,
              max_values: 1,
              type: 3,
            },
          ],
        },
      ],
      embeds: [
        {
          type: "rich",
          title: `Tech Saport`,
          description: [
            "* `/contact` - send a message to the developer.",
            "* `/ping` - check ping status and uptime.",
            "* `/donate` - send me 10 rupees in UPI.",
            "",
            "[Website](https://pixd.up.railway.app)   •   [Invite me](https://pixd.up.railway.app/invite)",
          ].join("\n"),
          color: 0xe08e67,
          footer: {
            text: "Send me new commands’ suggestions using the /contact command",
            icon_url:
              "https://cdn.discordapp.com/emojis/1142805565295308800.gif",
          },
          thumbnail: {
            url: "https://cdn.discordapp.com/emojis/898562618833383444.gif",
            height: 0,
            width: 0,
          },
        },
      ],
    });
  },
};
