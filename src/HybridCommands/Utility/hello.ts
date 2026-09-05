import HybridCommand from "../../structures/HybridCommand.js";

export default new HybridCommand({
  name: "hello",
  slashRoute: "hello world",
  description: "Say hello to PixD.",
  defer: false,
  execute: (ctx) => ctx.reply("Seriously?"),
});
