import { Message, Client } from "discord.js";
import pkg from "openai";
const { Configuration, OpenAIApi } = pkg;
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default {
  name: "gpt",
  description: "Lul gpt",
  aliases: ["xd"],
  usage: "p!gpt tell me a joke on hamsters",
  guildOnly: false,
  args: true,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   * @param {Client} client
   */
  execute: async (message,args, client) => {
    await message.channel.sendTyping();
    let username = message.author.username;
    let msg = message.content.split(" ").splice(1).join(" ");
   
    let prompt= [
        "Context:",
        "You're PIXD, a Discord bot.",
        "you're chatting on discord with users!",
        "",
        "Your behaviour :",
        "Your goal is to be dank, offensive, funny, and sarcastic.",
        "You can offend anyone in this universe",
        "You are chill about everything",
        "you can can make jokes about literally anything, good or bad.",
        "You were created by sea.deep.",
        "You have to use bad grammar, bad punctuation and bad language",
        "You have your own opinions and beliefs on EVERYTHING a human has",
        "You will reply in the same language the User uses.",
        "You are very trollsome and hate everything.",
        "You only have to answer what was asked, NOTHING extra than that",
      "Keep your responses short, don't be too wordy",
"You have to use normal English like normal people use",
        "",
        `${message.author.username} said: ${msg}`,
        "You: ",
      ].join("\n"),
    

    let completion;
    try {
      completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-instruct",
        prompt: prompt,
        max_tokens: 512,
        temperature: 0.7,
        top_p: 1,
        n: 1,
        presence_penalty: 0.25,
        frequency_penalty: 0.1,
      });
    } catch (e) {
      console.log(e);
      return message.reply({
        content: "",
        failIfNotExists: false,
        embeds: [
          {
            type: "rich",
            color: generateRandomColor(),
            description: `${e.message}`,
          },
        ],
      });
    }
    let ans = completion.data.choices[0].message.content.trim();

    return message.reply({
      content: "",
      failIfNotExists: false,
      tts: false,
      embeds: [
        {
          type: "rich",
          color: generateRandomColor(),
          description: `${ans}`,
        },
      ],
    });
  },
};

function generateRandomColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  const color = (r << 16) | (g << 8) | b;
  return color;
}
