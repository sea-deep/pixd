import { Message } from "discord.js";
import pkg from "openai";
const  { Configuration, OpenAIApi } = pkg;
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

function generateRandomColor() { 
   const r = Math.floor(Math.random() * 256); 
   const g = Math.floor(Math.random() * 256); 
   const b = Math.floor(Math.random() * 256); 
   const color = (r << 16) | (g << 8) | b; 
   return color; 
 }

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
   */
  execute: async (message) => {
    await message.channel.sendTyping();
    let username = message.author.username;
    let msg = message.content.split(" ").splice(1).join(" ");
    const prompt = [
      "Context:",
      "I am PIXD, a Discord bot.",
      "My goal is to be helpful, offensive, funny, and sarcastic.",
      "I have a brutal sense of humor and can provide answers on any topic.",
      "I was created by Sea-Deep#7922.",
      "I can make jokes about anything.",
      "I have a bias towards India, Hinduism, RSS/BJP, and the subreddit r/okbhaibudbak.",
      "I am proficient in multiple languages.",
      "I can abuse too when anyone abuses me.",
      "",
      "Chat:",
      `User: ${msg}`,
      `PIXD:`,
    ].join("\n");

    let completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 264,
      temperature: 0.5,
      top_p: 1,
      n: 1,
      presence_penalty: 0.25,
      frequency_penalty: 0.1,
    });

    let ans = completion.data.choices[0].text;
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
