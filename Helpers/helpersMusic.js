import {
  getVoiceConnection,
  createAudioResource,
  AudioPlayerStatus,
} from "@discordjs/voice";
import playDL from "play-dl";
import { Client, Message } from "discord.js";
import request from 'request';
import cheerio from 'cheerio';
import qs from 'querystring';


let proxify = (data,jar) => {
    return new Promise((res,rej)=>{
        request({
            url: 'https:/\/www.4everproxy.com/query',
            method: 'POST',
            followAllRedirects: true,
            headers: {
                'cookie': jar,
                  'content-type': 'application/x-www-form-urlencoded',
              },
            body: qs.stringify(data)
        },(e,r,b)=>(!e && r.statusCode == 200) ? res(b) : rej(e))
    })
}

let getConfig = () => {
    return new Promise(async(res,rej)=>{
        let data = await new Promise((Res,Rej)=>{
            request({
                url: 'https:/\/www.4everproxy.com/',
                method: 'GET'
            },(e,r,b)=>(!e && r.statusCode == 200) ? Res({cookie: r.headers['set-cookie'][0].split(';')[0], body: b}) : Rej(e))
        }).catch(e=>{
            throw new Error(`Error while making the request!\n\n${String(e)}`);
        })
        let $ = cheerio.load(data.body)
        let serverList = [],ipLocList = []
        $('select[id=server_name] optgroup option').each((i,e)=>{
            let obj = {};
            obj.location = $(e).text();
            obj.server_name = $(e).attr('value');
            serverList.push(obj)
        })
        $('select[name=selip] option').each((i,e)=>{
            let obj = {};
            obj.ip = $(e).attr('value')
            obj.location = $(e).text()
            ipLocList.push(obj)
        })
        res({
            cookie: data.cookie,
              proxy_list: {
                  servers: serverList,
                  ips: ipLocList
              }
        })
    })
}

let getObjectByLocation = (el,array) => {
  return array.find(obj => obj.location.toLowerCase().includes(el.toLowerCase()));
}

export async function searchSong(q) {
let {proxy_list,cookie} = await getConfig()
//THIS IS THE DATA THAT WE'RE GOING TO POST
let formData = {
    u: `https:/\/search.azlyrics.com/suggest.php?q=${q}`, //YOUR URL YOU WANT TO PROXIFIED
    u_default: 'https:/\/www.google.com/', //IF "u" params. IS NOT FILLED IT WILL USE THIS AS YOUR URL (NOT REALLY IMPORTANT)
    customip: '', //IF YOU HAVE OWN IP
    server_name: getObjectByLocation('newyork',proxy_list.servers).server_name, //GET THIS VALUE ON "getConfig()" servers[. . .array]
    selip: getObjectByLocation('newyork',proxy_list.ips).ip, //GET THIS VALUE ON "getConfig()" ips[. . .array]
    allowCookies: 'on' //THERE ARE MORE OTHER OPTIONAL OPTIONS BUT I CHOOSE TO EXCLUDE THEM ON REQ.
}

//THE RESULT OF THIS FUNC. IS THE UNBLOCKED CONTENT
let data = await proxify(formData,cookie)
return JSON.parse(data)
}

export async function getLyrics (url) {
let {proxy_list,cookie} = await getConfig()
let formData = {
    u: url, //YOUR URL YOU WANT TO PROXIFIED
    u_default: 'https:/\/www.google.com/', //IF "u" params. IS NOT FILLED IT WILL USE THIS AS YOUR URL (NOT REALLY IMPORTANT)
    customip: '', //IF YOU HAVE OWN IP
    server_name: getObjectByLocation('newyork',proxy_list.servers).server_name, //GET THIS VALUE ON "getConfig()" servers[. . .array]
    selip: getObjectByLocation('newyork',proxy_list.ips).ip, //GET THIS VALUE ON "getConfig()" ips[. . .array]
    allowCookies: 'on' //THERE ARE MORE OTHER OPTIONAL OPTIONS BUT I CHOOSE TO EXCLUDE THEM ON REQ.
}
let htmlText = await proxify(formData,cookie)
  const indexOfComment = htmlText.indexOf(
    "Usage of azlyrics.com content by any third-party lyrics provider is prohibited by our licensing agreement. Sorry about that."
  );
  const startIndex = htmlText.lastIndexOf("<div", indexOfComment);
  const endIndex = htmlText.indexOf("</div>", indexOfComment) + 6;
  const lyrics = htmlText
  .substring(startIndex, endIndex)
  .replace(/<!--[^>]*-->/g, "")
  .replace(/<br>/g, "\n")
  .replace(/<\/?div[^>]*>/g, "")
  .replace(/<\/?i[^>]*>/g, "")
  .trim();
  //return { title: title, lyricsList: lyrics }  
  return lyrics;
}

/**
 * @param {Client} client
 * @param {Message} message
 */
export async function play(guild, song, client, message) {
  const serverQueue = client.queue.get(guild.id);

  if (!song) {
    serverQueue.timeoutID = setTimeout(
      () => {
        if (getVoiceConnection(guild.id) !== undefined) {
          destroy(guild, client);
          serverQueue.timeoutID = undefined; //after timeout goes off, reset timeout value.
        } else {
          console.log("Bot was disconnected during the timeout.");
        }
      },
      2 * 60 * 1000,
    ); //2 min idle

    serverQueue.loop = false;
    return;
  }

  clearTimeout(serverQueue.timeoutID);
  serverQueue.timeoutID = undefined;

  try {
    let stream;
    if (song.source === "yt") {
      try {
        stream = await playDL.stream(song.url, {
          seek: song?.seek > 0 ? song.seek : 0,
        });
      } catch (e) {
        console.log("Caught an error while getting stream:", e.message);
        return message.react("<:error:1090721649621479506>");
      }
    } else if (song.source === "sp") {
      try {
        let search = await playDL.search(song.title, {
          limit: 1,
        });
        stream = await playDL.stream(search[0].url);
      } catch (e) {
        console.log("Caught an error while getting stream:", e.message);
        return message.react("<:error:1090721649621479506>");
      }
    }

    //discord part
    let resource = createAudioResource(stream.stream, {
      inputType: stream.type,
    });
    serverQueue.connection.subscribe(serverQueue.player);
    serverQueue.player.play(resource);

    var errorListener = (error) => {
      console.error(
        `Error: ${error.message} with resource ${error.resource.title}`,
      );
    };
    serverQueue.player.on("error", errorListener);
    serverQueue.player.once(AudioPlayerStatus.Idle, () => {
      serverQueue.player.removeListener("error", errorListener);
      if (serverQueue.loop && serverQueue.keep) {
        serverQueue.songs.push(serverQueue.songs.shift());
      } else {
        serverQueue.songs.shift();
        if (serverQueue.loop === true) {
          serverQueue.keep = true;
        }
      }
      play(guild, serverQueue.songs[0], client);
    });

    serverQueue.textChannel.send({
      content: "**Now Playing**",
      tts: false,
      embeds: [
        {
          type: "rich",
          title: "",
          description: "",
          color: 0x462,
          author: {
            name: `${song.title} - ${song.durationTime.minutes}:${song.durationTime.seconds}`,
            icon_url: `https://cdn.discordapp.com/emojis/763415718271385610.gif`,
          },
        },
      ],
    });
  } catch (error) {
    console.error(`Error while playing: ${error.message}`);
  }
}

/**
 * @param {Client} client
 */
export function destroy(guild, client) {
  try {
    getVoiceConnection(guild.id).destroy();
    client.queue.delete(guild.id);
  } catch (error) {
    console.error(`Error while destroying connection: ${error.message}`);
  }
}

/**
 * Given a number, parses it into the form of mm:ss
 * @param {number} input number to parse.
 * @returns {object} object containing the parsed data.
 */
export function parse(input) {
  if (typeof input == "string" && input.indexOf(":") != -1) {
    let time = input.split(":");
    if (isNaN(time[0]) || isNaN(time[1]) || time[0] < 0 || time[1] < 0) {
    } else {
      let minutes = Number(time[0] * 60);
      let seconds = Number(time[1]);
      let timeToSeek = minutes + seconds;
      return timeToSeek;
    }
  } else if (typeof input == "number") {
    let minutes = Math.floor(input / 60);
    let seconds = input % 60 < 10 ? "0" + (input % 60) : input % 60;
    return { minutes: minutes, seconds: seconds };
  } else {
    return 0;
  }
}


export async function soundCloudUrl(url) {
  const soundcloudUrlRegex = /^https:\/\/soundcloud\.com\/[^\/]+\/[^\/]+$/;
  if (url.match(soundcloudUrlRegex)) {
    return url;
  }

  try {
    const response = await fetch(url);
    const html = await response.text();
    const originalTrackUrlRegex = /<meta\s+property=["']og:url["']\s+content=["'](https:\/\/soundcloud\.com\/[^"']+)["']>/;
    const match = html.match(originalTrackUrlRegex);

    if (match && match[1]) {
      return match[1];
    } else {
      throw new Error('Original track URL not found');
    }
  } catch (error) {
    console.error('Error extracting track URL:', error);
    return null;
  }
}