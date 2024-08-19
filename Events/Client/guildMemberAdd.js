import { AttachmentBuilder, GuildMember, Client } from "discord.js";
import GIFEncoder from "gif-encoder-2";
import sharp from "sharp";
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
      // Fetch and process avtar..
      let avatarURL = member.user.displayAvatarURL({
        extension: "png",
        forceStatic: true,
      });
      let res = await fetch(avatarURL);
      let buffer = await res.arrayBuffer();
      const avatar = await sharp(buffer)
        .resize(92, 92, {
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();

      // Prepare text
      let text = `@${member.user.username} just joined the server`;

      // Prepare encoder
      const encoder = new GIFEncoder(427, 320);
      encoder.setDelay(100);
      encoder.start();

      // Preload assets and font data
      const frames = Array.from({ length: 33 }, (_, i) =>
        i < 10 ? `0${i}` : `${i}`,
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
        ]),
      );

      // Process frames in parallel
      const banners = await Promise.all(promises);

      // Add frames to encoder
      for (const banner of banners) {
        const { data } = await banner
          .raw()
          .toBuffer({ resolveWithObject: true });
        encoder.addFrame(data);
      }

      // Finish encoding
      encoder.finish();
      const welcome = encoder.out.getData();

      // Send the result to the Discord channel
      let channel = client.channels.cache.get("1128609011852390400");
      let file = new AttachmentBuilder(welcome, { name: "tofoquboolkaro.gif" });
      await channel.send({
        content: `Namaste saar <@${member.user.id}> cummed in sarvar`,
        files: [file],
      });
    }
  },
};
