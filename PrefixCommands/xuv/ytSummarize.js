import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client, Message } from "discord.js";
import { getVideoInfo } from "../../Helpers/helpersYt.js";
const genAI = new GoogleGenerativeAI(process.env.GOOGLEAI_KEY);

export default {
  name: "ytsummarize",
  description: "",
  aliases: ["ytsum", "ytsystum"],
  usage: "ytsum <youtube video url>",
  guildOnly: true,
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
    let match = message.content.match(/(https?|ftp):\/\/[^\s/$.?#].[^\s]*/i);
    if (!match || match.length === 0) {
      let er = await message.reply({
        content: "",
        embeds: [
          {
            title: "An error occurred:",
            color: client.color,
            description: "Not a valid YouTube URL",
          },
        ],
      });
      await client.sleep(10000);
      return er.delete();
    }
    let langMatch = message.content.match(/(?<= -)([a-zA-Z]+)/);
    let arg = match[0];
    let lang = langMatch ? langMatch[1] : "en";
    let call;
    let msg = await message.reply("Trying to summarise video...");
    try {
      call = await summarizeVideo(arg, lang);
    } catch (e) {
      let er = await msg.edit({
        content: "",
        embeds: [
          {
            title: "An error occurred:",
            description: e.message,
            color: client.color,
          },
        ],
      });
      await client.sleep(10000);
      return er.delete();
    }
    return msg.edit({
      content: "",
      embeds: [
        {
          author: {
            name: `Summary for: ${call.title}:`,
            icon_url: call.thumbnail,
          },
          description: call.summary,
          color: client.color,
        },
      ],
    });
  },
};

async function summarizeVideo(url, lang) {
  if (!url.includes("youtube.com") && !url.includes("youtu.be")) throw new Error("Not a valid YouTube URL");

  let ytInfo;
  try {
    ytInfo = await getVideoInfo(url);
  } catch (e) {
    throw new Error("Failed to fetch video info:\n" + e.message);
  }
  let subtitles = await getSubtitles(ytInfo.id, lang);
  if (!subtitles) throw new Error("Failed to fetch subtitles for this video");

  const prompt = [
    `Summarize the following YouTube video thoroughly. Please include all important information presented in the video.`,
    `Title: ${ytInfo.title} by Channel: ${ytInfo.channelName}`,
    `Video Description: ${ytInfo.description}`,
    `Subtitles:`,
    subtitles,
    "----------------",
    "Please ensure the summary is in English.",
    "Summarise the video in around 10 to 15 easy bite sized points, you can adjust it as per requirement.",
  ].join("\n");
  let result;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    result = await model.generateContent(prompt);
  } catch (e) {
    console.log(e.message);
    throw new Error(e);
  }
  const text = result.response.text();
  return {
    summary: text,
    title: ytInfo.title,
    thumbnail: ytInfo.thumbnail,
  };
}

async function fetchData(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch data from ${url}`);
  }
  return response.text();
}

async function convertString(inputString) {
  const htmlText = inputString
    .replace(/<text.+?>/, "")
    .replace(/<\/text>/, "")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x([0-9A-Fa-f]+);/g, (match, hexCode) =>
      String.fromCharCode(parseInt(hexCode, 16)),
    );
  return htmlText;
}

async function getSubtitles(videoID, lang) {
  const data = await fetchData(`https://youtube.com/watch?v=${videoID}`);

  if (!data.includes("captionTracks"))
    throw new Error("No captions found for this video");

  const regex = /"captionTracks":(\[.*?\])/;
  const [match] = regex.exec(data);

  const { captionTracks } = JSON.parse(`{${match}}`);
  const subtitle =
    captionTracks.find(
      ({ vssId }) =>
        vssId && (vssId.endsWith(`.${lang}`) || vssId.endsWith(`a.${lang}`)),
    ) || captionTracks.find(({ vssId }) => vssId && vssId.match(`.${lang}`));

  if (!subtitle || (subtitle && !subtitle.baseUrl))
    throw new Error(`No subtitles in "${lang}" language found for this video`);

  const transcript = await fetchData(subtitle.baseUrl);
  const lines = transcript
    .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', "")
    .replace("</transcript>", "")
    .split("</text>")
    .filter((line) => line && line.trim())
    .map(async (line) => {
      const text = await convertString(line);
      return text;
    });

  return (await Promise.all(lines)).join("\n");
}
