export default {
  name: "showQueue_",
  execute: async (interaction, client) => {
    await interaction.deferReply({
      ephemeral: true,
    });
    let player = client.poru.players.get(interaction.guild.id);
    let remaining = player.queue.slice(1);
    let chunks = [];

    for (let i = 0; i < remaining.length; i += 20) {
      let chunk = remaining.slice(i, i + 20);
      let song = "";
      chunk.forEach(
        (item, index) => (song += `${i + index + 2}. ${item.info.author} - ${item.info.title}\n`),
      );
      chunks.push(song);
    }

    for (let chunk of chunks) {
      await interaction.followUp({
        content: "",
        embeds: [
          {
            description: `${chunk}`,
            color: client.color,
          },
        ],
        ephemeral: true,
      });
    }
  },
};
