import { Client, Message } from "discord.js";

export default {
  name: "lastfm",
  description: "Login with Last.fm",
  aliases: ["lf"],
  usage: "",
  guildOnly: true,
  args: false,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   * @param {string[]} args
   * @param {Client} client
   */
  execute: async (message, args, client) => {
    const baseUrl = "http://www.last.fm/api/auth/";
    const params = new URLSearchParams({
      api_key: process.env.LASTFM_KEY,
      cb: `https://pixd.up.railway.app/lastfm/login?userid=${message.author.id}`,
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
      return message.reply({
        content: "",
        embeds: [
          {
            color: client.color,
            description: "Just sent you a DM.",
          },
        ],
      });
    } catch (e) {
      return message.reply({
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
