import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client, Message } from "discord.js";
import { getVideoInfo } from "../../Helpers/helpersYt.js";
import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

const genAI = new GoogleGenerativeAI(process.env.GOOGLEAI_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default {
  name: "ytsummarize",
  description: "summarise a youtube video using captions",
  aliases: ["ytsum", "ytsystum"],
  usage: "ytsum <youtube url> - <lang_code?>",
  guildOnly: true,
  args: true,
  permissions: { bot: [], user: [] },

  /**
   * @param {Message} message
   * @param {Client} client
   */
  execute: async (message, args, client) => {
    const match = message.content.match(/(https?:\/\/[^\s]+)/i);
    if (!match) {
      const er = await message.reply({
        embeds: [{ title: "An error occurred:", color: client.color, description: "Not a valid YouTube URL" }],
      });
      await (client.sleep?.(10000) ?? sleep(10000));
      return er.delete?.();
    }

    const url = match[0];
    const langMatch = message.content.match(/\s-\s*([a-zA-Z-]{2,6})/);
    const lang = (langMatch && langMatch[1]) || "en";

    let msg = await message.reply("Trying to summarise video...");
    let call;
    try {
      call = await summarizeVideo(url, lang);
    } catch (e) {
      const er = await msg.edit({
        embeds: [{ title: "An error occurred:", description: e.message, color: client.color }],
      });
      await (client.sleep?.(10000) ?? sleep(10000));
      return er.delete?.();
    }

    const truncated = call.summary.length > 4000 ? call.summary.slice(0, 3997) + "..." : call.summary;

    return msg.edit({
      embeds: [
        {
          author: { name: `Summary for: ${call.title}`, icon_url: call.thumbnail },
          description: truncated,
          color: client.color,
        },
      ],
    });
  },
};

async function summarizeVideo(url, lang = "en") {
  if (!url.includes("youtube.com") && !url.includes("youtu.be")) throw new Error("Not a valid YouTube URL");

  let ytInfo;
  try {
    ytInfo = await getVideoInfo(url);
  } catch (e) {
    throw new Error("Failed to fetch video info:\n" + e.message);
  }

  const videoId = ytInfo.id || ytInfo.videoId || extractVideoID(url);
  if (!videoId) throw new Error("Could not extract video id");

  let subtitles;
  try {
    subtitles = await getSubtitles(videoId, lang);
  } catch (e) {
    throw new Error("Failed to fetch subtitles: " + e.message);
  }

  if (!subtitles) throw new Error("No subtitles available for this video");

  const prompt = [
    "Summarize the following YouTube video thoroughly; include all important points.",
    `Title: ${ytInfo.title || ""}`,
    `Channel: ${ytInfo.channelName || ytInfo.author || ""}`,
    `Description: ${ytInfo.description || ""}`,
    "Subtitles:",
    subtitles,
    "----------------",
    "Please ensure the summary is in English.",
    "Summarise the video in around 10 to 15 easy bite-sized points.",
  ].join("\n");

  let result;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    result = await model.generateContent(prompt);
  } catch (e) {
    console.error("Generative AI error:", e);
    throw new Error("Generative model error: " + e.message);
  }

  const text = result?.response?.text?.() || String(result);

  return {
    summary: text,
    title: ytInfo.title || `Video ${videoId}`,
    thumbnail: (ytInfo.thumbnails?.[0]?.url || ytInfo.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`),
  };
}

/* ---------- subtitle helpers ---------- */

function extractVideoID(urlOrId) {
  if (!urlOrId) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  const short = urlOrId.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return short[1];
  const q = urlOrId.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (q) return q[1];
  const emb = urlOrId.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (emb) return emb[1];
  return null;
}

async function getInnertubeApiKey(videoUrl) {
  const res = await fetch(videoUrl);
  const html = await res.text();
  const match = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  if (!match) throw new Error("Failed to fetch INNERTUBE_API_KEY");
  return match[1];
}

async function getSubtitles(videoId, lang = "en") {
  try {
    const apiKey = await getInnertubeApiKey(`https://www.youtube.com/watch?v=${videoId}`);
    const endpoint = `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`;
    const body = { context: { client: { clientName: "WEB", clientVersion: "2.20210830.00.00" } }, videoId };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const captionTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks) throw new Error("No caption tracks found");

    const track = captionTracks.find((t) => t.languageCode === lang) || captionTracks[0];
    if (!track || !track.baseUrl) throw new Error("No suitable caption track found");

    const transcriptRes = await fetch(track.baseUrl);
    const transcriptXml = await transcriptRes.text();
    return parseTimedTextXml(transcriptXml);
  } catch (e) {
    throw new Error(e.message);
  }
}

function parseTimedTextXml(xml) {
  const lines = [];
  const reText = /<text[^>]*>([\s\S]*?)<\/text>/gi;
  let m;
  while ((m = reText.exec(xml))) lines.push(decodeHtmlEntities(m[1].replace(/\n+/g, " ").trim()));

  if (lines.length === 0) {
    const reP = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let p;
    while ((p = reP.exec(xml))) {
      let inner = p[1] || "";
      const segs = [];
      const reS = /<s[^>]*>([\s\S]*?)<\/s>/gi;
      let s;
      while ((s = reS.exec(inner))) segs.push(decodeHtmlEntities((s[1] || "").trim()));
      if (segs.length) lines.push(segs.join(" "));
    }
  }
  return lines.filter(Boolean).join("\n");
}

function decodeHtmlEntities(str) {
  if (!str) return "";
  str = str.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  str = str.replace(/&#([0-9]+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  const map = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  str = str.replace(/&([a-zA-Z]+);/g, (_, name) => map[name] ?? `&${name};`);
  return str;
}
