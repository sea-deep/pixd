import { AttachmentBuilder } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";

export default new HybridCommand({
  name: "donate",
  description: "Support PixD through UPI.",
  defer: false,
  execute: (ctx) => ctx.reply({
    files: [new AttachmentBuilder("./Assets/donate.mp4", { name: "donate.mp4" })],
    embeds: [{ description: "UPI ID :\n```\nseadeep@upi```" }],
  }),
});
