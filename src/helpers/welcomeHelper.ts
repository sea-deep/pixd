import { type GuildMember } from "discord.js";
import sharp from "sharp";
import { renderAnimatedGif } from "./gifHelper.js";

let cachedBgBuffers: Buffer[] | null = null;

async function getCachedBgBuffers(): Promise<Buffer[]> {
  if (!cachedBgBuffers) {
    const frames = Array.from({ length: 33 }, (_, i) =>
      i < 10 ? `0${i}` : `${i}`
    );
    cachedBgBuffers = await Promise.all(
      frames.map((frame) =>
        sharp(`./Assets/okbhaibudbak/frame_${frame}_delay-0.1s.gif`).toBuffer()
      )
    );
  }
  return cachedBgBuffers;
}

const circleMask = Buffer.from(
  '<svg width="92" height="92"><circle cx="46" cy="46" r="46" fill="#fff"/></svg>'
);

/**
 * Generates the animated OKBB welcome GIF for a guild member.
 */
export async function createOkbbWelcomeGif(member: GuildMember): Promise<Buffer> {
  const avatarURL = member.user.displayAvatarURL({
    extension: "png",
    forceStatic: true,
  });

  const res = await fetch(avatarURL);
  const buffer = await res.arrayBuffer();
  const avatar = await sharp(Buffer.from(buffer))
    .resize(92, 92)
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const username = member.user.username;

  // Render clean 2-line typography using Futura Condensed Bold
  const textName = await sharp({
    text: {
      text: `@${username}`,
      fontfile: "./Assets/futura.otf",
      font: "Futura Condensed Bold",
      width: 310,
      height: 44,
      align: "center",
      rgba: true,
    },
  })
    .png()
    .toBuffer();
  const metaName = await sharp(textName).metadata();

  const textJoined = await sharp({
    text: {
      text: "just joined the server",
      fontfile: "./Assets/futura.otf",
      font: "Futura Condensed Bold",
      width: 310,
      height: 38,
      align: "center",
      rgba: true,
    },
  })
    .png()
    .toBuffer();
  const metaJoined = await sharp(textJoined).metadata();

  const leftSpace = 104;
  const availableWidth = 427 - leftSpace; // 323
  const leftName = leftSpace + Math.max(0, Math.round((availableWidth - (metaName.width || 0)) / 2));
  const leftJoined = leftSpace + Math.max(0, Math.round((availableWidth - (metaJoined.width || 0)) / 2));

  // Pre-render banner once onto 427x104 white header
  const banner = await sharp({
    create: {
      width: 427,
      height: 104,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: avatar, top: 6, left: 6 },
      { input: textName, top: 8, left: leftName },
      { input: textJoined, top: 54, left: leftJoined },
    ])
    .png()
    .toBuffer();

  const bgBuffers = await getCachedBgBuffers();

  const rawFrames = await Promise.all(
    bgBuffers.map((bg) =>
      sharp(bg)
        .composite([{ input: banner, top: 0, left: 0 }])
        .raw()
        .toBuffer()
    )
  );

  // 50ms delay = 20 FPS (snappy original slapstick speed)
  return await renderAnimatedGif(rawFrames, 427, 320, 50);
}

