import { GoogleGenerativeAI } from "@google/generative-ai";
import play from "play-dl";
const genAI = new GoogleGenerativeAI(process.env.GOOGLEAI_KEY);
export default {
  subCommand: 'xuv ytsummarise',
  async execute (interaction, client) {
    await interaction.deferReply();
    let url = interaction.options.getString('yt-url');
    let lang = interaction.options.getString('lang-code');
    let call;
    try {
let call;
if (lang) {
  call = await summarizeVideo(url, lang);
} else {
  call = await summarizeVideo(url);
}
    } catch(e) {
      let er = await interaction.followUp({
        content: '',
        embeds: [{
          title: "An error occurred:",
          description: e.message,
          color: client.color
        }]
      });
      await client.sleep(10000);
      return er.delete();
    }
    return interaction.followUp({
      content: '',
      embeds: [{
        title: `Summary for: ${call.title}:`,
        description: call.summary,
        color: client.color,
        thumbnail: {
          url: call.thumbnail,
          height:0,
          width:0
        }
      }]
    });
  }
};


async function summarizeVideo(url, lang="en") {
  let check = play.yt_validate(url);
  if (check !== "video") throw new Error("Not a valid YouTube URL");
  
  let ytInfo;
  try {ytInfo = await play.video_basic_info(url);} catch(e) {
    throw new Error("Failed to fetch video info");
  }
  let subtitles = await getSubtitles(ytInfo.video_details.id, lang);
  if (!subtitles) throw new Error("Failed to fetch subtitles for this video");
  
  const prompt = [
    `Summarize the following YouTube video thoroughly. Please include all important information presented in the video.`,
    `Title: ${ytInfo.video_details.title} by Channel: ${ytInfo.video_details.channel.name}`,
    `Video Description: ${ytInfo.video_details.description}`,
    `Subtitles:`,
    subtitles,
    "----------------",
    "Please ensure the summary is in English in around 200 words and encompasses all the key points covered in the video including those from the subtitles.",
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
      title: ytInfo.video_details.title,
      thumbnail: ytInfo.video_details.thumbnails[0].url
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

  if (!data.includes("captionTracks")) throw new Error("No captions found for this video");

  const regex = /"captionTracks":(\[.*?\])/;
  const [match] = regex.exec(data);

  const { captionTracks } = JSON.parse(`{${match}}`);
  const subtitle =
    captionTracks.find(
      ({ vssId }) =>
        vssId && (vssId.endsWith(`.${lang}`) || vssId.endsWith(`a.${lang}`)),
    ) || captionTracks.find(({ vssId }) => vssId && vssId.match(`.${lang}`));

  if (!subtitle || (subtitle && !subtitle.baseUrl)) throw new Error(`No subtitles in "${lang}" language found for this video`);

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