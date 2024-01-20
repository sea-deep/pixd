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
   // console.log(results);
    if (results.status !== "success") return interaction.reply({content: "**❌ | No results found for that search query...**", ephemeral: true});


  const chunks = [];
    for (let i = 0; i < results.files_found.length; i += 25) {
        chunks.push(results.files_found.slice(i, i + 25));
    }

    let fields = [];
    chunks[0].forEach((item, index) => {
      fields.push({
        name: `${index+1}. ${item.file_name}`,
        value: `>>> **Type:** \`${item.file_type}\`\n**Size:** \`${item.file_size !== "" ? item.file_size: "N/A"}\`\n**Added ${item.time_ago}**\n**File link:** [\`Click here\`](${item.file_link})`,
      });
    });

  
    await interaction.reply({
      ephemeral: true,
      content: `Found **${results.files_found.length} results.**`,
      tts: false,
      embeds: [
        {
          type: "rich",
          title: "🔍 "+interaction.options.getString("query"),
          description: "",
          color: 0x2f9d97,
          fields: fields,
          footer: {text: "Note: Some links may not work!"}
        },
      ],
    });
    if(chunks.length == 2) {
      let fields2 = [];
    chunks[1].forEach((item, index) => {
      fields2.push({
        name: `${index+1}. ${item.file_name}`,
        value: `>>> **Type:** \`${item.file_type}\`\n**Size:** \`${item.file_size !== "" ? item.file_size: "N/A"}\`\n**Added ${item.time_ago}**\n**File link:** [\`Click here\`](${item.file_link})`,
      });
    });
    await interaction.followUp({
      ephemeral: true,
      content: ``,
      tts: false,
      embeds: [
        {
          type: "rich",
          title: "",
          description: "",
          color: 0x2f9d97,
          fields: fields,
          footer: {text: "Note: Some links may not work!"}
        },
      ],
    });
    }
  },
};