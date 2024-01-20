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

    if (results.status !== "success") return interaction.reply("**❌ | No results found for that search query...**");

    const items = Array.from(
      { length: Math.ceil(results.files_found.length / 10) },
      (_, index) => results.files_found.slice(index * 10, (index + 1) * 10)
    );

    let fields = [];
    items[0].forEach((item) => {
      fields.push({
        name: item.file_name,
        value: `**Type:** \`${item.file_type}\` • **Size:** \`${item.file_size}\` • **Added ${item.times_ago}**\n**File link:** [\`Click here\`](${item.file_link})`,
      });
    });

    let disabled = items.length < 2;
    return interaction.reply({
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
        },
      ],
    });
  },
};