import { VoiceState, Client } from "discord.js";
import Event from "../../structures/Event.js";
import Logger from "../../helpers/Logger.js";

export default new Event({
  event: "voiceStateUpdate",
  execute: async (oldState: VoiceState, newState: VoiceState, client: Client) => {
    const guild = oldState.guild || newState.guild;
    if (!guild) return;

    // 1. If an attached music manager exists (e.g. client.music.get(guild.id))
    const player = client.music?.get(guild.id);
    if (player) {
      if (newState.id === client.user?.id) {
        if (newState.channelId && newState.channelId !== player.voiceChannelId) {
          player.voiceChannelId = newState.channelId;
        }
      }

      if (
        oldState.channelId === player.voiceChannelId ||
        newState.channelId === player.voiceChannelId
      ) {
        player.checkChannelEmpty();
      }
      return;
    }

    // 2. Standard Discord.js voice channel empty check:
    // If the bot itself is in a voice channel, auto-leave when no humans remain
    const botMember = guild.members.me;
    const botChannel = botMember?.voice?.channel;
    if (!botChannel) return;

    // Only inspect if someone joined or left the bot's current channel
    if (
      oldState.channelId !== botChannel.id &&
      newState.channelId !== botChannel.id
    ) {
      return;
    }

    // Check if any non-bot members remain in the channel
    const members = botChannel.members;
    const humanCount = typeof (members as any)?.filter === "function"
      ? (members as any).filter((member: any) => !member.user?.bot).size
      : [...members.values()].filter((member: any) => !member.user?.bot).length;

    if (humanCount === 0) {
      Logger.info(`Leaving empty voice channel ${botChannel.name ?? botChannel.id} (${botChannel.id}) in ${guild.name} - no humans present.`);
      await botMember.voice.disconnect().catch(() => {});
    }
  },
});
