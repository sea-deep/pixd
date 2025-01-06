import { ChatInputCommandInteraction, Client } from "discord.js";

export default {
  data: {
    name: "piracy",
    description:
      "Search and download anything you want! Videos, audios, ebooks, etc.",
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
    await interaction.deferReply({
      ephemeral: true,
    });
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
    const apiUrl = "https://filepursuit.p.rapidapi.com/";
    const response = await fetch(`${apiUrl}?${params}`, options);
    const results = await response.json();
    // console.log(results);
    if (results.status !== "success")
      return interaction.reply({
        content: "**❌ | No results found for that search query...**",
        ephemeral: true,
      });

    const filesFound = results.files_found.slice(0, 30);

    let fields = Array.from(
      { length: Math.ceil(filesFound.length / 10) },
      (_, chunkIndex) => {
        const startIndex = chunkIndex * 10;
        return filesFound
          .slice(startIndex, startIndex + 10)
          .map((item, index) => ({
            name: `${startIndex + index + 1}. ${item.file_name}`,
            value: `>>> **Type:** \`${item.file_type}\`\n**Size:** \`${item.file_size !== "" ? item.file_size : "N/A"}\`\n**Added ${item.time_ago}**\n**File link:** [\`Click here\`](${item.file_link})`,
          }));
      },
    ).filter((chunk) => chunk.length > 0);

    fields.forEach(async (field, i) => {
      await interaction.followUp({
        ephemeral: true,
        content: `${i === 0 ? `Found **${results.files_found.length} results.**` : ""} (${i + 1}/${fields.length})`,
        tts: false,
        embeds: [
          {
            type: "rich",
            title:
              i === 0 ? "🔍 " + interaction.options.getString("query") : "",
            description: "",
            color: 0xe08e67,
            fields: field,
            footer: { text: "Note: Some links may not work!" },
          },
        ],
      });
    });
  },
};
