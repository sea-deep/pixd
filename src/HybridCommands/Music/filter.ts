import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { replyWithError, requirePlayer } from "../../services/music/commandHelpers.js";
import { AUDIO_FILTERS, parseAudioFilter } from "../../services/music/audioFilters.js";
import type { AudioFilter } from "../../services/music/types.js";

export default new HybridCommand({
  name: "filter",
  description: "Set or view audio filters.",
  aliases: ["filters", "fx", "fitler"],
  usage: "[bassboost | slowed | sped | nightcore | vaporwave | 8d | karaoke | distorted | off]",
  guildOnly: true,
  options: [{
    type: ApplicationCommandOptionType.String,
    name: "preset",
    description: "Filter to apply",
    required: false,
    choices: [
      { name: "Off", value: "off" },
      { name: "Bass Boost", value: "bassboost" },
      { name: "Slowed + Reverb", value: "slowed" },
      { name: "Sped Up", value: "sped" },
      { name: "Nightcore", value: "nightcore" },
      { name: "Vaporwave", value: "vaporwave" },
      { name: "8D Audio", value: "8d" },
      { name: "Karaoke", value: "karaoke" },
      { name: "Distorted", value: "distorted" },
    ],
  }],
  execute: (context) => replyWithError(context, async () => {
    const rawInput = context.options.getString("preset");

    // If no argument is passed, display the active filter and menu
    if (!rawInput || !rawInput.trim()) {
      const player = context.guild ? context.raw.client.music?.get(context.guild.id) : null;
      const currentFilter: AudioFilter = player?.filter || "off";
      const currentDef = AUDIO_FILTERS[currentFilter];

      const lines = [
        "**Audio Filters**",
        `Active: **${currentDef.label}**`,
        "",
        "Available: `bassboost`, `slowed`, `sped`, `nightcore`, `vaporwave`, `8d`, `karaoke`, `distorted`, `off`",
        "Usage: `p!filter <name>`",
      ];
      return context.reply({ content: lines.join("\n") });
    }

    const targetFilter = parseAudioFilter(rawInput);
    if (!targetFilter) {
      throw new Error(
        `Unknown filter \`${rawInput}\`. Available: \`bassboost\`, \`slowed\`, \`sped\`, \`nightcore\`, \`vaporwave\`, \`8d\`, \`karaoke\`, \`distorted\`, \`off\`.`
      );
    }

    const player = requirePlayer(context);
    const def = AUDIO_FILTERS[targetFilter];

    if (player.filter === targetFilter) {
      return context.reply(`Filter is already set to **${def.label}**.`);
    }

    await player.setFilter(targetFilter);

    if (targetFilter === "off") {
      return context.reply("Filter disabled.");
    }

    return context.reply(`Filter set to **${def.label}**.`);
  }),
});
