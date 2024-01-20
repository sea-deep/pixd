import { ChatInputCommandInteraction, Client } from "discord.js";

export default {
  data: {
    name: "download",
    description: "Search and download anything you want! Videos, audios, ebooks, etc.",
    options: [
      {
        type: 3,
        name: "query",
        description: "What are you searching for?",
        required: true,
      },
      {
        type: 3,
        name: "type",
        description: "What type of file are you searching for?",
        choices: [
          { name: "Videos 🎥", value: "video" },
          { name: "Audios 🎵", value: "audio" },
          { name: "eBooks 📚", value: "ebook" },
          { name: "Mobile apps 📱", value: "mobile" },
          { name: "Archives (ZIP/ISO) ⛓", value: "archive" },
        ],
      },
      {
        type: 3,
        name: "sort",
        description: "Sort by?",
        choices: [
          { name: "Date Added 🔽", value: "datedesc" },
          { name: "Date Added 🔼", value: "dateasc" },
          { name: "Size 🔽", value: "sizedesc" },
          { name: "Size 🔼", value: "sizeasc" },
          { name: "Name (A-Z)", value: "fileasc" },
          { name: "Name (Z-A)", value: "filedesc" },
        ],
      },
    ],
  },
  /**
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */
  execute: async (interaction, client) => {
    let type = interaction.options.getString("type");
    let sort = interaction.options.getString("sort");

    const params = new URLSearchParams({
      q: interaction.options.getString("query"),
      ...(type !== null && { type: type }),
      ...(sort !== null && { sort: sort }),
    });

    const options = {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": process.env.RAPID_KEY,
        "X-RapidAPI-Host": "filepursuit.p.rapidapi.com",
      },
    };
    const apiUrl = 'https://filepursuit.p.rapidapi.com/';
    const response = await fetch(`${apiUrl}?${params}`, options);
    const results = await response.json();
    console.log(results);
    if (results.status !== "success") return interaction.reply({content: "**❌ | No results found for that search query...**", ephemeral: true});

   
  const items = [];
    for (let i = 0; i < results.files_found.length; i += 10) {
        items.push(results.files_found.slice(i, i + 10));
    }

    let fields = [];
    items[0].forEach((item, index) => {
      fields.push({
        name: `${index+1}. ${item.file_name}`,
        value: `>>> **Type:** \`${item.file_type}\`\n**Size:** \`${item.file_size !== "" ? item.file_size: "N/A"}\`\n**Added ${item.time_ago}**\n**File link:** [\`Click here\`](${item.file_link})`,
      });
    });

    let disabled = items.length < 2;
   let message = await interaction.reply({
      ephemeral: true,
      content: `Found **${results.files_found.length} results.**`,
      tts: false,
      components: [
        {
          type: 1,
          components: [
            { style: 1, custom_id: `dl_left`, disabled: true, emoji: { id: null, name: `◀` }, type: 2 },
            { style: 1, label: `1/${items.length}`, custom_id: `dl_page`, disabled: true, type: 2 },
            { style: 1, custom_id: `dl_right`, disabled: disabled, emoji: { id: null, name: `▶` }, type: 2 },
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
    await client.keyv.set(message.id, items, 1800);
    console.log("messaging Id", message.id)
  },
};