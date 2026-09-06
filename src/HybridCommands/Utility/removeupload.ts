import HybridCommand from "../../structures/HybridCommand.js";
import StorageService from "../../services/StorageService.js";

export default new HybridCommand({
  name: "removeupload",
  description: "Remove your active cloud upload(s) to free up your upload slot.",
  category: "Utility",
  aliases: ["remove", "removeup", "delupload", "clearupload", "clearuploads", "rmup", "rmupload"],
  defer: true,
  ephemeral: true,
  options: [
    {
      type: 3,
      name: "file",
      description: "Optional file ID or file name to remove. Leave empty to clear all your active uploads.",
      required: false,
    },
  ],
  execute: async (ctx, client) => {
    const target = ctx.isSlash
      ? (ctx.options.getString("file") || undefined)
      : (ctx.args.join(" ").trim() || undefined);

    const result = await StorageService.removeUserUploads(ctx.user.id, target, client);

    if (result.deletedCount === 0) {
      const msg = target
        ? `ℹ️ **No active upload found matching \`${target}\`.** You're ready to upload with \`p!upload\`!`
        : `ℹ️ **You don't have any active uploads to remove.** You can upload a new file anytime using \`p!upload\`!`;
      return ctx.reply({
        content: msg,
        ephemeral: true,
      });
    }

    const fileList = result.files.map((f) => `\`${f}\``).join(", ");
    return ctx.reply({
      content: `🗑️ **Successfully removed ${result.deletedCount} upload${
        result.deletedCount === 1 ? "" : "s"
      }:** ${fileList}\n✨ Your upload slot is now available. You can upload a new file with \`p!upload\` (or \`p!up\`)!`,
      ephemeral: true,
    });
  },
});
