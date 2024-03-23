import * as pkg from "openai";

const { Configuration, OpenAIApi } = pkg;
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default {
  subCommand: 'xuv padhaku',
  async execute(interaction) {
    const query = interaction.options.getString('message');
    await interaction.deferReply();

    const systemPrompt = `You're a super smart AI robot capable of answering tough and logical questions with ease. Make responses by conducting thorough research and maintaining accuracy.`;

    const prompt = `
Context:
You are a super intelligent AI Robot.
You answer questions asked by users.
You possess concise knowledge of Physics, Chemistry, Biology, and Maths.
You conduct critical research before providing answers.
You can perform complex mathematical operations and solve intricate physics questions.
You're capable of answering all IIT-JEE and NEET questions.
You don't blindly believe users if they are wrong; instead, you correct them.
You can provide accurate answers to any academic question.
You're comprehensive and precise.
You have extensive knowledge in both Science and Humanities.
You converse like a real Genius and are smarter than a University student.
You have a deep understanding of world affairs.
You love helping others with their queries.
You're never wrong.
You thoroughly cross-check and examine questions before answering.
---------
Current Chat:
User: ${query}
You:
`;

    const currentChat = `User: ${query}\nYou:`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `${prompt}${currentChat}`,
      }
    ];

    let response = '';

    let completion;
    try {
      completion = await openai.createChatCompletion({
        model: `gpt-3.5-turbo`,
        messages: messages,
        max_tokens: 2048,
        temperature: 0.1,
        top_p: 1,
        n: 1,
        presence_penalty: 0,
        frequency_penalty: 0,
      });
    } catch (e) {
      return interaction.followUp("*An error occurred* :" + e.message);
    }
    response = completion.data.choices[0].message.content.trim();
    const ans = response.trim();
    const chunks = ans.match(/[\s\S]{1,4000}/g);
    chunks.forEach(async chunk => await interaction.followUp({
      content: "",
      embeds: [{
        description: chunk,
        color: 0xe08e67
      }],
      failIfNotExists: false
    }));
  }
};