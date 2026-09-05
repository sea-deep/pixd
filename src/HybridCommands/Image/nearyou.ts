import HybridCommand from "../../structures/HybridCommand.js";
import { imageOptions } from "../../Interactions/SlashCommands/image.js";
import { commandInput, contextImage } from "../../helpers/commandInput.js";
import { AttachmentBuilder } from "discord.js";
import sharp from "sharp";
import { extractFrames, renderAnimatedGif } from "../../helpers/gifHelper.js";

export default new HybridCommand({
  name: "nearyou",
  slashRoute: "img nearyou",
  options: imageOptions("nearyou"),
  description: "This person lives 0kms near you.",
  aliases: ["nearme"],
  usage: "",
  guildOnly: true,
  permissions: {
    bot: [],
    user: [],
  },
  execute: async (ctx, client) => {
    const input = commandInput(ctx);
    const url = await contextImage(ctx);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    const buffer = Buffer.from(await res.arrayBuffer());

    const extracted = await extractFrames(buffer, 30);
    const resizedAvatars = await Promise.all(
      extracted.frames.map((f) =>
        sharp(f).resize(252, 252, { fit: "fill" }).toBuffer()
      )
    );

    // Prepare 60 template frames
    const rawFrames: Buffer[] = [];
    for (let i = 0; i < 60; i++) {
      const frameNum = i < 10 ? `0${i}` : `${i}`;
      const currentAvatar = resizedAvatars[i % resizedAvatars.length];
      const frameRaw = await sharp(`./Assets/nearframes/frame_${frameNum}_delay-0.17s.gif`)
        .composite([{ input: currentAvatar, top: 70, left: -21 }])
        .raw()
        .toBuffer();
      rawFrames.push(frameRaw);
    }

    const gifBuffer = await renderAnimatedGif(rawFrames, 360, 360, 150);
    const file = new AttachmentBuilder(gifBuffer, { name: "nearyou.gif" });

    await ctx.reply({
      content: "",
      files: [file],
    });
  },
});
