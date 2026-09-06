import { type GuildMember } from "discord.js";
import sharp from "sharp";
import { renderAnimatedGif } from "./gifHelper.js";

/**
 * Generates the animated OKBB welcome GIF for a guild member using Sharp.
 */
export async function createOkbbWelcomeGif(member: GuildMember): Promise<Buffer> {
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

  const rawFrames = await Promise.all(
    frames.map((frame) =>
      sharp(`./Assets/okbhaibudbak/frame_${frame}_delay-0.1s.gif`)
        .composite([
          { input: avatar, top: 6, left: 6 },
          {
            input: {
              text: {
                text,
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
        .raw()
        .toBuffer()
    )
  );

  return await renderAnimatedGif(rawFrames, 427, 320, 100);
}
