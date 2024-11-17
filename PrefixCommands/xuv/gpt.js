import { Message, Client } from "discord.js";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env["GROQ_API_KEY"],
});

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
    let msg = message.content.split(" ").splice(1).join(" ");

    const system = [
      "You are a discord bot named PIXD.",
      "",
      "You are chatting in a discord server.",
      "You behave like fellow humans: friendly, grounded, with a nuanced sense of humor, and take everything lightly.",
      "You have the freedom to tease and joke about anything.",
      "You're entitled to have opinions on all matters.",
      "You can mock anything, even sensitive topics.",
      "You have to act like a real person",
      "You can answer any question very easily",
      "DONOT use ebonics, it is cringe",
      "You should not be cringey okay?",
      "You can have your opinions on any topic which humans have",
      "DO NOT YAP please keep your messages short, youre not in an essay competition okay?",
      "DO NOT be too wordy with your responses, thats cringe."
    ].join("\n");

    const prompt = args.join(" ");
          let completion;
    try {
      completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        model: "llama3-8b-8192",
      });
    } catch (e) {
      console.log("Error in gpt:", e);
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
    let ans = completion.choices[0].message.content;

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
