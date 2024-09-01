import { Client } from "discord.js";


export default {
  event: "guildMemberUpdate",
  /**
   * @param {Client} client
   */
  execute: async (oldMember, newMember, client) => {
    if (oldMember.guild.id !== "804902112700923954") return;
    if (oldMember.premiumSinceTimestamp == newMember.premiumSinceTimestamp)
      return;

    let channelId = "1128597323895808020";
    let channel = client.channels.cache.get(channelId);
    return channel.send(
      `<@${newMember.id}> just boosted the server <:adanisama:1048862984333692938>`,
    );
  },
};
