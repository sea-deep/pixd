import MessageContextMenu from "../../structures/MessageContextMenu.js";

export default new MessageContextMenu({
  data: { name: "React Genesis" },
  execute: (interaction) => interaction.reply({ content: "This command has been discontinued.", flags: 64 }),
});
