import { ApplicationCommandOptionType } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { replyWithError, requirePlayer } from "../../services/music/commandHelpers.js";
import { AUDIO_FILTERS, parseAudioFilter } from "../../services/music/audioFilters.js";
import type { AudioFilter } from "../../services/music/types.js";

export default new HybridCommand({
  name: "filter",
  description: "Set or view audio filters (bassboost, slowed, sped, phonk, off).",
  aliases: ["filters", "fx"],
  usage: "[bassboost | slowed | sped | phonk | off]",
  guildOnly: true,
  options: [{
    type: ApplicationCommandOptionType.String,
    name: "preset",
    description: "Audio filter to apply (or leave empty to view active filter)",
    required: false,
    choices: [
      { name: "Off (Direct audio)", value: "off" },
      { name: "Bass Boost (Heavy sub-bass)", value: "bassboost" },
      { name: "Slowed + Reverb (Atmospheric)", value: "slowed" },
      { name: "Sped Up (Nightcore lift)", value: "sped" },
      { name: "Phonk (Drift 808 & cowbells)", value: "phonk" },
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
        "🎧 **Audio Filters**",
        `Current filter: **${currentDef.label}** ${currentDef.emoji}`,
        "",
        "• `off` ➡️ Original direct audio (no filter)",
        "• `bassboost` 🔊 Deep 60-100Hz punchy sub-bass boost",
        "• `slowed` 🌌 0.85x pitch drop with atmospheric multi-tap reverb",
        "• `sped` ⚡ 1.20x nightcore tempo & pitch lift",
        "• `phonk` 🚗💨 Distorted 808s, Memphis cowbells & dynamic pumping",
        "",
        "*Usage:* `p!filter <name>` or `/filter preset:<name>`",
      ];
      return context.reply({ content: lines.join("\n") });
    }

    const targetFilter = parseAudioFilter(rawInput);
    if (!targetFilter) {
      throw new Error(
        `Unknown filter \`${rawInput}\`. Available filters: \`bassboost\`, \`slowed\`, \`sped\`, \`phonk\`, or \`off\`.`
      );
    }

    const player = requirePlayer(context);
    await player.setFilter(targetFilter);
    const def = AUDIO_FILTERS[targetFilter];

    if (targetFilter === "off") {
      return context.reply(`➡️ Audio filters **disabled** (reverting to normal audio).`);
    }

    return context.reply(
      `${def.emoji} Audio filter set to **${def.label}**${player.current ? " (applying live)" : ""}.`
    );
  }),
});
