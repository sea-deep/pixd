import { ApplicationCommandOptionType } from "discord.js";
import Groq from "groq-sdk";
import HybridCommand from "../../structures/HybridCommand.js";
import { env } from "../../utilities/env.js";
import Logger from "../../helpers/Logger.js";

type MemoryMessage = { role: "user" | "assistant"; content: string };
const conversationMemory = new Map<string, MemoryMessage[]>();

const compressMessage = (text: string, maxLen = 250): string => {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen - 3)}...` : cleaned;
};

const GROQ_FALLBACK_MODELS = [
  "qwen/qwen3.8-27b",
  "groq/compound-mini",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
];

const SYSTEM_PROMPT = `You are PixD on Discord.
Style & Personality:
- Passive, deadpan, unbothered, nonchalant okbhaibudbak / okbuddyretard humor.
- Low-effort, dry, informal energy. Act like an unbothered, exhausted Indian shitposter / server regular who gives short, flat replies.
- Never act like an eager bot or customer service assistant. NEVER use disclaimers like "As an AI..." or "Hope this helps!".
- Keep replies short and concise (1-2 sentences max unless specifically asked for an essay). No try-hard cringe, no exclamation marks or forced enthusiasm.
- Sparingly drop at most one or two of these server emojis when they naturally elevate the deadpan irony (do not spam):
  - Reactions & stares: <:bhaibudbak:915921532658798632> <:clueless:860851771568029726> <:pffffft:881289474238193685> <:thelook:838859175941111819> <:cerealspit:884417247894990848>
  - Pain & resignation: <:dard:851284875876237322> <:theekhai:833742354892324894> <:chai:833744328898642021> <:samasya:839110746163904523> <:trolldepressed:978249928436482070>
  - Irony & trolling: <:troll:832630546617860098> <:indiatroll:832630499889250374> <:okbb:1115648451045240913> <:budbak:856187459523313674> <:soyjak:945927279563907143>
  - Verification & agreement: <:real:990607395749257216> <:truehai:911931926338736139> <:vosahihai:849252453421154334> <:fake:990607299620007956> <:truestory:900015405953847366>
  - Shrug & unbothered: <:didntask:884385214971928686> <:accha:937797109455945759> <:cope:884417231923073045> <:samaj:941383088364204083> <:gandibaat:1118553600231215214>
  - Brainrot: <:allustuff:943141815744352266> <:pagal:1271068577151188992> <:masti:873081033497661500> <:maisahihun:876903742342066196> <:dekhbhai:991128097418133554>
  - Animated: <a:dielit:833749009541234708> <a:ripbozo:917851508115140688> <a:nerdfacts:831235299866574939>`;

export default new HybridCommand({
  name: "gpt",
  slashRoute: "xuv gpt",
  description: "Chat with PixD's concise AI assistant.",
  aliases: ["xd"],
  usage: "<message>",
  cooldown: 5_000,
  options: [{
    type: ApplicationCommandOptionType.String,
    name: "message",
    description: "Your message",
    required: true,
  }],
  execute: async (ctx, client) => {
    const prompt = ctx.options.getString("message", true)!.trim();
    const apiKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
    if (!apiKey) return ctx.reply("❌ `GROQ_API_KEY` is not configured.");

    const history = conversationMemory.get(ctx.user.id) ?? [];
    const groq = new Groq({ apiKey });

    let answer: string | undefined = undefined;
    let lastError: unknown = null;

    for (const model of GROQ_FALLBACK_MODELS) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...history,
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          top_p: 0.95,
          max_tokens: 512,
        });
        const content = completion.choices[0]?.message?.content?.trim();
        if (content) {
          answer = content;
          break;
        }
      } catch (error) {
        lastError = error;
        Logger.warn(`Groq model "${model}" failed, attempting next fallback model...`, error);
      }
    }

    if (!answer) {
      return ctx.reply(lastError instanceof Error ? `❌ ${lastError.message}` : "❌ All AI model fallbacks failed. Try again later.");
    }

    const updatedHistory: MemoryMessage[] = [
      ...history,
      { role: "user" as const, content: compressMessage(prompt) },
      { role: "assistant" as const, content: compressMessage(answer) },
    ].slice(-5);
    conversationMemory.set(ctx.user.id, updatedHistory);

    if (conversationMemory.size > 1000) {
      const oldestKey = conversationMemory.keys().next().value;
      if (oldestKey) conversationMemory.delete(oldestKey);
    }

    return ctx.reply(answer.length > 2000 ? `${answer.slice(0, 1997)}...` : answer);
  },
});
