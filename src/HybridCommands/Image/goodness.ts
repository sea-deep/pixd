import HybridCommand from "../../structures/HybridCommand.js";
import { imageOptions } from "../../Interactions/SlashCommands/image.js";
import { commandInput, contextImage } from "../../helpers/commandInput.js";
import { AttachmentBuilder } from "discord.js";
import sharp from "sharp";
import { readFile } from "fs/promises";
import { extractFrames, renderAnimatedGif } from "../../helpers/gifHelper.js";

let cachedGoodnessFrames: Buffer[] | null = null;

async function getGoodnessFrames(): Promise<Buffer[]> {
  if (!cachedGoodnessFrames) {
    const templateBuf = await readFile("./Assets/goodness.gif");
    cachedGoodnessFrames = await Promise.all(
      Array.from({ length: 34 }, (_, i) =>
        sharp(templateBuf, { page: i }).toBuffer()
      )
    );
  }
  return cachedGoodnessFrames;
}

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
        sharp(f)
          .flatten({ background: "#ffffff" })
          .resize(160, 157, { fit: "fill" })
          .toBuffer()
      )
    );

    const templateFrames = await getGoodnessFrames();
    const rawFrames = await Promise.all(
      templateFrames.map((bg, i) => {
        const currentAvatar = resizedAvatars[i % resizedAvatars.length];
        return sharp(bg)
          .composite([{ input: currentAvatar, top: 139, left: 101 }])
          .raw()
          .toBuffer();
      })
    );

    const gifBuffer = await renderAnimatedGif(rawFrames, 260, 296, 50);
    const file = new AttachmentBuilder(gifBuffer, { name: "goodnessgraciousness.gif" });

    await ctx.reply({
      content: "",
      files: [file],
    });
  },
});
