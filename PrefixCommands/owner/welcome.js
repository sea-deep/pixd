import { AttachmentBuilder } from "discord.js";
import sharp from "sharp";
import { encode } from "modern-gif";

export default {
  name: "welcome",
  description: "simulate a welcome message (prefix command) for a tagged member",
  aliases: [],
  usage: "<@member>",
  guildOnly: true,
  args: false,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   * @param {Client} client
   */
  execute: async (message, args, client) => {
    if (message.author.id !== "1258396025354453054") return;
    const member = message.mentions.members.first();
    if (!member) return message.reply("pls tag a member rn");

    switch (member.guild.id) {
      case "804902112700923954":
        return sendOkbb(member, client);
      case "883291433925242950":
        await sendSs(member, client);
        break;
      default:
        break;
    }

    async function sendOkbb(member, client) {
      const avatarURL = member.user.displayAvatarURL({
        extension: "png",
        forceStatic: true,
      });
      const res = await fetch(avatarURL);
      const buffer = await res.arrayBuffer();
      const avatar = await sharp(Buffer.from(buffer))
        .resize(92, 92, {
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();

      const text = `@${member.user.username} just joined the server`;
      const frames = Array.from({ length: 33 }, (_, i) =>
        i < 10 ? `0${i}` : `${i}`
      );
      const promises = frames.map((frame) =>
        sharp(`./Assets/okbhaibudbak/frame_${frame}_delay-0.1s.gif`).composite([
          { input: avatar, top: 6, left: 6 },
          {
            input: {
              text: {
                text: text,
                fontfile: "./Assets/futura.otf",
                width: 315,
                height: 92,
                align: "center",
                font: "Futura Condensed Bold",
              },
            },
            blend: "difference",
            top: 6,
            left: 104,
          },
        ])
      );

      const banners = await Promise.all(promises);
      const gifFrames = await Promise.all(
        banners.map(async (banner) => {
          const { data } = await banner.raw().toBuffer({ resolveWithObject: true });
          return { data: data, delay: 100 };
        })
      );

      const output = await encode({
        width: 427,
        height: 320,
        frames: gifFrames,
      });

      const welcomeGif = new Blob([output], { type: "image/gif" });
      const channel = client.channels.cache.get("1128609011852390400");
      const file = new AttachmentBuilder(
        Buffer.from(await welcomeGif.arrayBuffer()),
        { name: "tofoquboolkaro.gif" }
      );
      await channel.send({
        content: `namaste saar <@${member.user.id}> cummed in sarvar`,
        files: [file],
      });
    }

    async function sendSs(member, client) {
      const channelId = "883299030359228457";
      const channel = client.channels.cache.get(channelId);
      channel.send(`**${member.user.tag}** just joined the server!!`);
    }
  },
};
