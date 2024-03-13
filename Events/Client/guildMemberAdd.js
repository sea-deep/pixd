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
      let text = `@${member.user.username} just joined the server`;
      let channel_id = "1128609011852390400";
      const encoder = new GIFEncoder(427, 320);
      encoder.setDelay(50);
      encoder.start();
      for (let i = 0; i < 65; i++) {
        const frame = i < 10 ? `0${i}` : `${i}`;
        const bg = `./Assets/okbhaibudbak/frame_${frame}_delay-0.05s.gif`;
        const banner = sharp(bg).composite([
          { input: avatar, top: 6, left: 6 },
          {
            input: {
              text: {
                text: text,
                fontfile: "./Assets/futura.otf",
                width: 315,
                height: 92,
                align: "center",
                justify: true
                font: "Futura Condensed Bold",
              },
            },
            blend: "difference",
            top: 6,
            left: 104,
          },
        ]);
        const { data } = await banner
          .raw()
          .toBuffer({ resolveWithObject: true });
        encoder.addFrame(data);
      }
      encoder.finish();
      const welcome = encoder.out.getData();
      let file = new AttachmentBuilder(welcome, { name: "tofoquboolkaro.gif" });
      let channel = client.channels.cache.get(channel_id);
      await channel.send({
        content: `Namaste saar <@${member.user.id}> cummed in sarvar`,
        files: [file],
      });
    }
    async function sendPajeet(member, client) {
      const rounded = Buffer.from(
        '<svg><rect x="0" y="0" width="50" height="50" rx="50" ry="50"/></svg>',
      );
      let avatarURL = member.user.displayAvatarURL({
        extension: "png",
        forceStatic: true,
      });
      let res = await fetch(avatarURL);
      let buffer = await res.arrayBuffer();
      let avatar = await sharp(buffer)
        .resize(275)
        .composite({
          input: rounded,
          blend: "dest-in",
        })
        .toBuffer();
      let wlcm = await sharp("./Assets/pajeet.png")
        .composite([{ input: avatar, top: 78, left: 50 }])
        .png()
        .toBuffer();
      let file = new AttachmentBuilder(wlcm, {
        name: "aagaya_muh_uthake.png",
      });
      let channel = client.channels.cache.get("1065736446981451776");
      return channel.send({
        content: `Namaste sirs <@${member.user.id}> did poo in the loo`,
        files: [file],
      });
    }
  },
};
