import { Message, Client } from "discord.js";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env["GROQ_API_KEY"],
});


const convoMemory = new Map();

export default {
  name: "gpt",
  description: "lul gpt",
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

    const prompt = args.join(" ").trim();
    if (!prompt) {
      return message.reply({
        content: "please give me something to say (e.g. `xd tell me a joke`).",
        failIfNotExists: false,
      });
    }

    const system = [
      "you are pixd: a human-feeling assistant — concise, clever, and useful.",
      "keep answers short (1-3 sentences) and add one crisp example when helpful.",
      "never produce hate, illegal instructions, or fabricated facts; say 'idk' if unsure.",
      "adjust tone to the user's style: casual for chat, precise for tech.",
    ].join("\n");

    const userId = message.author.id;
    const history = convoMemory.get(userId) || [];

    const messages = [
      { role: "system", content: system },
      ...history,
      { role: "user", content: prompt },
    ];

    let completion;
    try {
      completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.6,
        top_p: 0.95,
        max_tokens: 512,
      });
    } catch (e) {
      console.error("error in gpt:", e);
      return message.reply({
        content: "",
        failIfNotExists: false,
        embeds: [
          {
            type: "rich",
            title: "an error occurred",
            color: client.color ?? 0xff0000,
            description: e?.message ?? "unknown error",
          },
        ],
      });
    }

    const ans =
      completion?.choices?.[0]?.message?.content ??
      completion?.choices?.[0]?.text ??
      null;

    if (!ans) {
      return message.reply({
        content: "i couldn't get a reply from the model. try again later.",
        failIfNotExists: false,
      });
    }


    const newHistory = (convoMemory.get(userId) || []).slice(); // clone
    newHistory.push({ role: "user", content: prompt });
    newHistory.push({ role: "assistant", content: ans });
    if (newHistory.length > 5) {
      //only last 5 msg
      newHistory.splice(0, newHistory.length - 5);
    }
    convoMemory.set(userId, newHistory);

    const truncated = ans.length > 4000 ? ans.slice(0, 3997) + "..." : ans;

    return message.reply({
      content: "",
      failIfNotExists: false,
      tts: false,
      embeds: [
        {
          color: client.color ?? 0x2f3136,
          type: "rich",
          description: truncated,
        },
      ],
    });
  },
};
