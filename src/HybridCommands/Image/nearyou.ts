import HybridCommand from "../../structures/HybridCommand.js";
import { imageOptions } from "../../Interactions/SlashCommands/image.js";
import { commandInput, contextImage } from "../../helpers/commandInput.js";
import { AttachmentBuilder } from "discord.js";
import sharp from "sharp";
import { readFile } from "fs/promises";
import { extractFrames, renderAnimatedGif } from "../../helpers/gifHelper.js";

let cachedNearyouFrames: Buffer[] | null = null;

async function getNearyouFrames(): Promise<Buffer[]> {
  if (!cachedNearyouFrames) {
    const templateBuf = await readFile("./Assets/nearyou.gif");
    cachedNearyouFrames = await Promise.all(
      Array.from({ length: 60 }, (_, i) =>
        sharp(templateBuf, { page: i }).toBuffer()
      )
    );
  }
  return cachedNearyouFrames;
}

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
        sharp(f)
          .flatten({ background: "#ffffff" })
          .resize(252, 252, { fit: "fill" })
          .toBuffer()
      )
    );

    const templateFrames = await getNearyouFrames();
    const rawFrames = await Promise.all(
      templateFrames.map((bg, i) => {
        const currentAvatar = resizedAvatars[i % resizedAvatars.length];
        return sharp(bg)
          .composite([{ input: currentAvatar, top: 70, left: -21 }])
          .raw()
          .toBuffer();
      })
    );

    const gifBuffer = await renderAnimatedGif(rawFrames, 360, 360, 170);
    const file = new AttachmentBuilder(gifBuffer, { name: "nearyou.gif" });

    await ctx.reply({
      content: "",
      files: [file],
    });
  },
});
