import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { replyWithError, requirePlayer } from "../../services/music/commandHelpers.js";
import config from "../../../Configs/config.js";

export function getVolumeEmoji(volume: number): string {
  if (volume === 0) return "🔇";
  if (volume < 30) return "🔈";
  if (volume < 70) return "🔉";
  return "🔊";
}

export default new HybridCommand({
  name: "volume",
  description: "Check or set the music playback volume.",
  aliases: ["vol", "v"],
  usage: `[0-${config.music.maxVolume}]`,
  examples: ["volume", "volume 50", "vol 80"],
  guildOnly: true,
  options: [
    {
      type: ApplicationCommandOptionType.Integer,
      name: "level",
      description: `Volume percentage (0 to ${config.music.maxVolume})`,
      required: false,
      minValue: 0,
      maxValue: config.music.maxVolume,
    },
  ],
  execute: (context) => replyWithError(context, () => {
    const player = requirePlayer(context);
    const rawArg = context.args[0];
    const level = context.options.getInteger("level");

    if (level === null && rawArg !== undefined && rawArg.trim().length > 0) {
      throw new Error(`Volume must be a number between 0 and ${config.music.maxVolume}%.`);
    }

    if (level === null) {
      const vol = player.volume;
      const emoji = getVolumeEmoji(vol);
      return context.reply(`${emoji} Current volume is **${vol}%**.`);
    }

    player.setVolume(level);
    const emoji = getVolumeEmoji(level);
    return context.reply(`${emoji} Volume set to **${level}%**.`);
  }),
});
