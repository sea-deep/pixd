import { AttachmentBuilder, GuildMember, Client } from "discord.js";
import sharp from "sharp";
import { encode } from "modern-gif";

export default {
  event: "guildMemberAdd",
  /**
   * @param {Client} client
   * @param {GuildMember} member
   */
  execute: async (member, client) => {
    switch (member.guild.id) {
      case "804902112700923954":
        await sendOkbb(member, client);
        break;
      case "1062998378293776384":
        await sendPajeet(member, client);
        break;
      default:
        break;
    }

    async function sendOkbb(member, client) {
      // Fetch and process avatar
      let avatarURL = member.user.displayAvatarURL({
        extension: "png",
        forceStatic: true,
      });
      let res = await fetch(avatarURL);
      let buffer = await res.arrayBuffer();
      const avatar = await sharp(Buffer.from(buffer))
        .resize(92, 92, {
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();

      // Prepare text
      let text = `@${member.user.username} just joined the server`;

      // Preload assets and font data
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

      // Process frames in parallel
      const banners = await Promise.all(promises);

      // Encode GIF using modern-gif
      const gifFrames = await Promise.all(
        banners.map(async (banner) => {
          const { data } = await banner.raw().toBuffer({ resolveWithObject: true });
          return { data: data, delay: 100 }; // Adjust delay as needed
        })
      );

      const output = await encode({
        width: 427,
        height: 320,
        frames: gifFrames,
      });

      const welcomeGif = new Blob([output], { type: "image/gif" });

      // Send the result to the Discord channel
      let channel = client.channels.cache.get("1128609011852390400");
      let file = new AttachmentBuilder(
        Buffer.from(await welcomeGif.arrayBuffer()),
        { name: "tofoquboolkaro.gif" }
      );
      await channel.send({
        content: `Namaste saar <@${member.user.id}> cummed in sarvar`,
        files: [file],
      });
    }
  },
};
