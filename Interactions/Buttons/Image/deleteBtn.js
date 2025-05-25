export default {
  name: "delete-btn",

  execute: async (interaction, client) => {
    await client.interactionDefer(interaction);
    const perms = interaction.member.permissions.toArray();
    const requiredPerms = ["Administrator", "ManageMessages"];
    if (
      perms.includes(requiredPerms) ||
      interaction.member.id ===
        interaction.message.mentions?.users.first().id ||
      interaction.member.user.username === "am.deepak" ||
      interaction.member.id === interaction.message.interaction?.user.id
    ) {
      return interaction.message.delete();
    } else {
      interaction.followUp({
        content: "",
        ephemeral: true,
        embeds: [
          {
            description: "**You cannot delete this message.**",
            color: client.color,
          },
        ],
      });
    }
  },
};
