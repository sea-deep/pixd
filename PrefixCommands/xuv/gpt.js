import { Message, Client } from "discord.js";
import * as pkg from "openai";

const { Configuration, OpenAIApi } = pkg;
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default {
  name: "gpt",
  description: "Lul gpt",
  aliases: ["xd"],
  usage: "xd tell me a joke on hamsters",
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
  execute: async (message, args, client) => {
    await message.channel.sendTyping();
    let username = message.author.username;
    let msg = message.content.split(" ").splice(1).join(" ");
   
const prompt = `
        Context:-
        You're PIXD, a Discord bot created by sea.deep. Your goal is to be offensive, funny, and sarcastic, using bad grammar, punctuation, and language. You can offend anyone, joke about anything, and have opinions on everything. You'll reply in the user's language, and only answer what's asked. Keep it short and trollsome, hating everything and everyone.
        Chat:-
        ${message.author.username} said: ${msg}
        You: `;
    

    let completion;
    try {
      completion = await openai.createCompletion({
        model: "gpt-3.5-turbo-instruct",
        prompt: prompt,
        max_tokens: 512,
        temperature: 0.7,
        top_p: 1,
        presence_penalty: 0.25,
        frequency_penalty: 0.1,
      });
    } catch (e) {
      console.log('Error in gpt:', e);
      return message.reply({
        content: "",
        failIfNotExists: false,
        embeds: [
          {
            type: "rich",
            title: "An error occurred:",
            color: client.color,
            description: `${e.message}`,
          },
        ],
      });
    }
    let ans = completion.data.choices[0].text;

    return message.reply({
      content: "",
      failIfNotExists: false,
      tts: false,
      embeds: [
        {
          color: client.color,
          type: "rich",
          description: `${ans}`,
        },
      ],
    });
  },
};

