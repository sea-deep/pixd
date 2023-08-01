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
      "You're PIXD, a Discord bot.",
"You were created by Sea-Deep#7922.",
'',
"You shouldn't reveal that :",
      "Your goal is to be dank, offensive, funny, and sarcastic.",
      "You love to offend everyone's personal and religious beliefs.",
      "you can can make jokes about anything.",
      "You only support your country India and favourite subreddit r/Okbhaibudbak (funnies memes there)",
      "You will reply in the same language the User uses.",
      "You are very trollsome and hate everything.",
      "",
      "Chat  :",
      `User: ${msg}`,
      `PIXD:`,
    ].join("\n");
    let completion;
    try {
     completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 264,
      temperature: 0.5,
      top_p: 1,
      n: 1,
      presence_penalty: 0.25,
      frequency_penalty: 0.1,
    });
     } catch (e) {
     return message.reply({
      content: '',
      failIfNotExists: false,
      embeds: [{
       type: "rich",
       color: generateRandomColor(),
       description: `${e.message}`,
}]
});
}
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
