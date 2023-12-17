export default {
  name: 'ud_left',
  execute: (interaction) => {
    const msg = interaction.message;
    const btn = msg.components[0].components[1].label;
    const currentPage = parseInt(btn.split("/")[0]) - 1;
    const maxPage = parseInt(btn.split("/")[1]) - 1;
    let goto = currentPage - 1;
    if(currentPage == 0) {goto = maxPage}

    let res = await urban.search(msg.embeds[0].title);
    let def = res.list[goto];
    await interaction.reply({
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
        label: `1/${res.list.length}`,
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
    ],
  },
],
      embeds: [
        {
          type: "rich",
          title: def.word,
          description: def.definition,
          color: 0x6969,
          fields: [
            {
              name: "Example:",
              value: def.example,
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
   }
}