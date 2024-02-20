import { Message } from "discord.js";

export default {
  name: "help",
  description: "Get some help.",
  aliases: ["commands"],
  usage: "help",
  guildOnly: false,
  args: false,
  permissions: {
    bot: [],
    user: [],
  },
  /**
    * @param {Message} message
    */
  execute: async (message) => {
    await message.reply({
        content: `**Command list** :`,
  tts: false,
  components: [
    {
      type: 1,
      components: [
        {
          custom_id: 'cmd',
          placeholder: `Select Category`,
          options: [
            {
              label: `XUV 780 technology`,
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
            {
              label: `No-Fap Streak (Not working)`,
              value: `fap`,
              description: `No-Fap Streak counter!`,
              emoji: {
                id: `1084742439694245928`,
                name: `nofap`,
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
      type: 'rich',
      title: `Tech Saport`,
      description: `- </contact:000> : Send a message to developer\n- \`p!ping\`: Check latency and uptime.\n\n[Website](https://pixd.onrender.com/home) • [Invite](https://pixd.onrender.com/invite)`,
      color: 0xbbab30,
      thumbnail: {
        url: 'https://images-ext-2.discordapp.net/external/uFIhM0gaX0cTSdv3zispJ0ffhjOtel4mUcXISBFRgow/https/cdn.discordapp.com/emojis/898562618833383444.gif',
        height: 0,
        width: 0,
      },
    },
  ],
    });
  }
};
