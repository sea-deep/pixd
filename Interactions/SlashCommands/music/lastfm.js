import { ChatInputCommandInteraction } from "discord.js";

export default {
  data: {
    name: "lastfm",
    description: "Authorise PIXD to your last.fm account",
  },
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  execute: async (interaction) => {
    const baseUrl = "http://www.last.fm/api/auth/";
    const params = new URLSearchParams({
      api_key: process.env.LASTFM_KEY,
      cb: `https://pixd-production.up.railway.app/lastfm/login?userid=${message.author.id}`,
    });

    const authUrl = `${baseUrl}?${params.toString()}`;
    try {
      await message.member.send({
        content: "",
        embeds: [
          {
            description:
              "**Click the button below to authorise your Last.fm account with PIXD.**",
            color: client.color,
          },
        ],
        components: [
          {
            type: 1,
            components: [
              {
                style: 5,
                label: `LOGIN WITH LAST.FM`,
                url: authUrl,
                disabled: false,
                type: 2,
              },
            ],
          },
        ],
      });
      return interaction.reply({
        ephemeral: true,
        content: "",
        embeds: [
          {
            color: client.color,
            description: "Just sent you a DM.",
          },
        ],
      });
    } catch (e) {
      return interaction.reply({
        ephemeral: true,
        content: "",
        embeds: [
          {
            title: "An error occurred while sending you a DM",
            description: e.message,
            footer: {
              text: 'Make sure you have "Direct Messages" enabled in this server',
            },
          },
        ],
      });
    }
  },
};