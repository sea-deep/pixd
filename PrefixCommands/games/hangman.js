import { Client, Message } from "discord.js";
import hangman from "../../Assets/hangman.js";

export default {
  name: "hangman",
  description: "play hangman game on discord",
  aliases: [""],
  usage: "",
  guildOnly: true,
  args: false,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   * @param {Client} client
   */
  execute: async (message, args, client) => {
    let val = hangman.words[Math.floor(Math.random() * hangman.words.length)];
    let msg = await message.channel.send({
      content: `<@${message.author.id}>'s Game`,
      tts: false,
      components: [
        {
          type: 1,
          components: [
            {
              custom_id: `hangAtoY`,
              placeholder: `A to Y`,
              options: [
                {
                  label: `A`,
                  value: `hang_a`,
                  default: false,
                },
                {
                  label: `B`,
                  value: `hang_b`,
                  default: false,
                },
                {
                  label: `C`,
                  value: `hang_c`,
                  default: false,
                },
                {
                  label: `D`,
                  value: `hang_d`,
                  default: false,
                },
                {
                  label: `E`,
                  value: `hang_e`,
                  default: false,
                },
                {
                  label: `F`,
                  value: `hang_f`,
                  default: false,
                },
                {
                  label: `G`,
                  value: `hang_g`,
                  default: false,
                },
                {
                  label: `H`,
                  value: `hang_h`,
                  default: false,
                },
                {
                  label: `I`,
                  value: `hang_i`,
                  default: false,
                },
                {
                  label: `J`,
                  value: `hang_j`,
                  default: false,
                },
                {
                  label: `K`,
                  value: `hang_k`,
                  default: false,
                },
                {
                  label: `L`,
                  value: `hang_l`,
                  default: false,
                },
                {
                  label: `M`,
                  value: `hang_m`,
                  default: false,
                },
                {
                  label: `N`,
                  value: `hang_n`,
                  default: false,
                },
                {
                  label: `O`,
                  value: ` hang_o`,
                  default: false,
                },
                {
                  label: `P`,
                  value: `hang_p`,
                  default: false,
                },
                {
                  label: `Q`,
                  value: `hang_q`,
                  default: false,
                },
                {
                  label: `R`,
                  value: `hang_r`,
                  default: false,
                },
                {
                  label: `S`,
                  value: `hang_s`,
                  default: false,
                },
                {
                  label: `T`,
                  value: `hang_t`,
                  default: false,
                },
                {
                  label: `U`,
                  value: `hang_u`,
                  default: false,
                },
                {
                  label: `V`,
                  value: `hang_v`,
                  default: false,
                },
                {
                  label: `W`,
                  value: `hang_w`,
                  default: false,
                },
                {
                  label: `X`,
                  value: `hang_x`,
                  default: false,
                },
                {
                  label: `Y`,
                  value: `hang_y`,
                  default: false,
                },
              ],
              min_values: 1,
              max_values: 1,
              type: 3,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              custom_id: `HangZ`,
              placeholder: `Z`,
              options: [
                {
                  label: `Z`,
                  value: `hang_z`,
                  default: false,
                },
              ],
              min_values: 1,
              max_values: 1,
              type: 3,
            },
          ],
        },
      ],
      embeds: [
        {
          type: "rich",
          title: `🚹 Hangman`,
          image: {
            url: "https://iili.io/JTa8KbI.png",
            width: 192,
            height: 256,
          },
          color: 0xe08e67,
          fields: [
            {
              name: `Guess:`,
              value: `\`\`\`\n${"_".repeat(val.length)}\n\`\`\``,
            },
          ],
          footer: {
            text: `Each time you make wrong guess, the hangman gets closer to Kota.`,
          },
        },
      ],
    });

    let key = `hangman${msg.id}`;

    client.keyv.set(key, val);
  },
};
