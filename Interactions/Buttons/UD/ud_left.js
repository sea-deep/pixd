import { Client } from "discord.js";

export default {
  name: "ud_left",
  /**
   * @param {Client} client
   */
  execute: async (interaction, client) => {
    await interaction.deferUpdate();
    const msg = interaction.message;
    const btn = msg.components[0].components[1].label;
    const currentPage = parseInt(btn.split("/")[0]) - 1;
    const maxPage = parseInt(btn.split("/")[1]) - 1;
    let goto = currentPage - 1;
    if (currentPage == 0) {
      goto = maxPage;
    }

    let term = await client.keyv.get(`ud${msg.id}`);
    let res = await search(term);
    let def = res.list[goto];
    return interaction.message.edit({
      content: "",
      tts: false,
      components: [
        {
          type: 1,
          components: [
            {
              style: 1,
              custom_id: `ud_left`,
              disabled: false,
              emoji: {
                id: null,
                name: `◀`,
              },
              type: 2,
            },
            {
              style: 2,
              label: `${goto + 1}/${res.list.length}`,
              custom_id: `nulll`,
              disabled: true,
              type: 2,
            },
            {
              style: 1,
              custom_id: `ud_right`,
              disabled: false,
              emoji: {
                id: null,
                name: `▶`,
              },
              type: 2,
            },
            {
              style: 5,
              label: `Get the “${def.word}” mug.`,
              url: `https://urbandictionary.store/products/mug?defid=${def.defid}`,
              disabled: false,
              emoji: {
                id: null,
                name: `🍵`,
              },
              type: 2,
            },
          ],
        },
      ],
      embeds: [
        {
          type: "rich",
          title: def.word,
          description: def.definition.replaceAll(
            /\[(.*?)\]/g,
            (match, word) =>
              `[${word}](https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word)})`,
          ),
          color: client.color,
          fields: [
            {
              name: "Example:",
              value: def.example.replaceAll(
                /\[(.*?)\]/g,
                (match, word) =>
                  `[${word}](https://www.urbandictionary.com/define.php?term=${encodeURIComponent(word)})`,
              ),
            },
          ],
          author: {
            name: def.author,
            url: `https://urbandictionary.com/`,
            icon_url: `https://images.crunchbase.com/image/upload/c_lpad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_1/u8zidc2jnlhz3n1dcbrr`,
          },
          footer: {
            text: `👍:${def.thumbs_up} | 👎:${def.thumbs_down}`,
          },
          url: def.permalink,
        },
      ],
    });
  },
};


const BASE_URL = 'https://api.urbandictionary.com/v0';

async function search(query, page = 1) {
  const url = `${BASE_URL}/define?page=${page}&term=${query}`;
  const response = await fetch(url);
  const body = await response.json();
  return body;
}
