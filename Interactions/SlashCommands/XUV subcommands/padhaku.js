import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env["GROQ_API_KEY"],
});

export default {
  subCommand: "xuv padhaku",
  async execute(interaction) {
    const query = interaction.options.getString("message");
    await interaction.deferReply();
    let systemPrompt = [
      `You a super smart AI robot who can answer tough and logical questions easily.`,
      `Make responses by doing full research and maintaining accuracy.`,
    ].join(" ");
    const prompt = [
      `Context:`,
      `You are a super intelligent AI Robot.`,
      `You answer to the questions asked by the user.`,
      `You have very concise knowledge of Physics, Chemistry, Biology, and Maths`,
      `You do critical research before sending answer to the user.`,
      `You can perform large mathematical operations and complex physics questions.`,
      `You are smart enough to answer all the IIT-JEE and NEET questions.`,
      `You don't believe the user blindly if they are wrong, instead you correct them`,
      `You can answer to any academic question accurately`,
      `You are comprehensive and accurate.`,
      `You have a full range of knowledge in Science and Humanities.`,
      `You talk like a real Genius and you are smarter than a University student.`,
      `You have a very complex undersatanding of world affairs`,
      `You love helping others with their queries`,
      `You are never wrong.`,
      `You do cross check and examine in the depth of the questions before answering.`,
      "---------",
      `Current Chat:`,
    ].join("\n");

    let currentChat = [`User: ${query}`, `You:`].join("\n");

    let messages = [].concat(
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: [].concat(prompt, currentChat).join("\n"),
      }
    );

    let response = "";

    let completion;
    try {
      completion = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        messages: messages,
        max_tokens: 2048,
        temperature: 0.1,
        top_p: 1,
        n: 1,
        presence_penalty: 0,
        frequency_penalty: 0,
      });
    } catch (e) {
      return message.reply("*An error occurred* :" + e.message);
    }
    response = completion.choices[0].message.content;
    const ans = response.trim();
    const chunks = ans.match(/[\s\S]{1,4000}/g);
    chunks.forEach(
      async (chunk) =>
        await interaction.followUp({
          content: "",
          embeds: [
            {
              description: chunk,
              color: 0xe08e67,
            },
          ],
          failIfNotExists: false,
        })
    );
  },
};
