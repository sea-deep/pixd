import { Client } from "discord.js";  

 export default {  
   name: 'dl_left',  
   /**  
     * @param {Client} client  
     */  
   execute: async (interaction, client) => {   
    const msg = interaction.message;
    const btn = msg.components[0].components[1].label;
    const currentPage = parseInt(btn.split("/")[0]) - 1;
    const maxPage = parseInt(btn.split("/")[1]) - 1;
    let goto = currentPage - 1;
    let disabled = goto === 0;
    let items = await client.keyv.get(msg.id);
    let fields = [];
    items[goto].forEach((item, index) => {
      fields.push({
        name: `${index+1}. ${item.file_name}`,
        value: `>>> **Type:** \`${item.file_type}\`\n**Size:** \`${item.file_size !== "" ? item.file_size: "N/A"}\`\n**Added ${item.time_ago}**\n**File link:** [\`Click here\`](${item.file_link})`,
      });
    });


   return interaction.reply({
      ephemeral: true,
      content: `Found **${results.files_found.length} results.**`,
      tts: false,
      components: [
        {
          type: 1,
          components: [
            { style: 1, custom_id: `dl_left`, disabled: disabled, emoji: { id: null, name: `◀` }, type: 2 },
            { style: 1, label: `1/${items.length}`, custom_id: `dl_page`, disabled: true, type: 2 },
            { style: 1, custom_id: `dl_right`, disabled: false, emoji: { id: null, name: `▶` }, type: 2 },
          ],
        },
      ],
      embeds: [
        {
          type: "rich",
          title: interaction.options.getString("query"),
          description: "",
          color: 0x2f9d97,
          fields: fields,
          footer: {text: "Note: Some links may not work!"}
        },
      ],
    });
   }
 };