import SlashCommand from "../../structures/SlashCommand.js";
export default new SlashCommand({
  data: {
    name: "hello",
    description: "hello!",
    options: [
      {
        type: 1,
        name: "world",
        description: "hello world!",
      },
    ],
  },
});
