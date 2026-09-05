import HybridCommand from "../../structures/HybridCommand.js";
import { imageOptions } from "../../Interactions/SlashCommands/image.js";
import { commandInput, contextImage } from "../../helpers/commandInput.js";
import { AttachmentBuilder } from "discord.js";
import sharp from "sharp";
import { extractFrames, renderAnimatedGif } from "../../helpers/gifHelper.js";

export default new HybridCommand({
  name: "goodness",
  slashRoute: "img goodness",
  options: imageOptions("goodness"),
  description: "oh my goodness gracious",
  aliases: ["gracious"],
  usage: "goodness",
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

    const extracted = await extractFrames(buffer, 34);
    const resizedAvatars = await Promise.all(
      extracted.frames.map((f) =>
        sharp(f).resize(160, 157, { fit: "fill" }).toBuffer()
      )
    );

    // Prepare 34 template frames
    const rawFrames: Buffer[] = [];
    for (let i = 0; i < 34; i++) {
      const frameNum = i < 10 ? `0${i}` : `${i}`;
      const currentAvatar = resizedAvatars[i % resizedAvatars.length];
      const frameRaw = await sharp(`./Assets/goodness/frame_${frameNum}_delay-0.05s.gif`)
        .composite([{ input: currentAvatar, top: 139, left: 101 }])
        .raw()
        .toBuffer();
      rawFrames.push(frameRaw);
    }

    const gifBuffer = await renderAnimatedGif(rawFrames, 260, 296, 50);
    const file = new AttachmentBuilder(gifBuffer, { name: "goodnessgraciousness.gif" });

    await ctx.reply({
      content: "",
      files: [file],
    });
  },
});
