import Event from "../../structures/Event.js";
import { Client, GuildMember } from "discord.js";

export default new Event({
  event: "guildMemberRemove",
  /**
   * @param {Client} client
   * @param {GuildMember} member
   */
  execute: async (member, client) => {
    switch (member.guild.id) {
      case "804902112700923954":
        await sendOkbb(member, client);
        break;
      case "883291433925242950":
        await sendSs(member, client);
        break;
      default:
        break;
    }
    async function sendSs(member: GuildMember, client: Client) {
      let channelId = "883299030359228457";
      let channel = client.channels.cache.get(channelId);
      channel?.isSendable() && channel.send(`**${member.user.tag}** Left.`);
    }
    async function sendOkbb(member: GuildMember, client: Client) {
      let channel = client.channels.cache.get("1128609011852390400");
      channel?.isSendable() && channel.send(`ayyo saar **${member.user.tag}** gayaa`);
    }
  },
});
