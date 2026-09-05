import Component from "../../../structures/Component.js";
export default new Component({
  customId: "showQueue_",
  type: "button",
  execute: async (interaction, client) => {
    await interaction.deferReply({
      ephemeral: true,
    });
    let player = client.music.get(interaction.guild.id);
    if (!player) return interaction.editReply({ content: "The queue has ended." });
    let remaining = player.queue;
    let chunks = [];

    for (let i = 0; i < remaining.length; i += 20) {
      let chunk = remaining.slice(i, i + 20);
      let song = "";
      chunk.forEach(
        (item, index) => (song += `${i + index + 1}. ${item.author} - ${item.title}\n`),
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
});
