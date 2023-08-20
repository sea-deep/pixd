import { ChatInputCommandInteraction} from "discord.js";

export default {
  data: {
    name: 'help',
    description: 'Get some help.'
  },
  /**
   * @param {ChatInputCommandInteraction} interaction 
   */
  execute: async (interaction) => {
    return interaction.reply({
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
              label: `No-Fap Streak`,
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
      description: `- </contact:000> : Send a message to developer\n- </ping:000> : Check latency and uptime.\n\n[Website](https://pixd.onrender.com/home) • [Invite](https://pixd.onrender.com/invite)\n[Terms Of Service and Privacy Policy](https://pixd.onrender.com/legal)`,      color: 0xbbab30,
      thumbnail: {
        url: 'https://images-ext-2.discordapp.net/external/tFhoHS9MjXYHhgP8R0eBKW7sr1ZDbvOCYuLmzEa8KXU/https/cdn.discordapp.com/emojis/1142805565295308800.gif',
        height: 0,
        width: 0,
      },
    },
  ],
    });
  }
};

