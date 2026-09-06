import Event from "../../structures/Event.js";
import { AttachmentBuilder, GuildMember, Client } from "discord.js";
import { createOkbbWelcomeGif } from "../../helpers/welcomeHelper.js";

export default new Event({
  event: "guildMemberAdd",
  /**
   * @param {Client} client
   * @param {GuildMember} member
   */
  execute: async (member, client) => {
    switch (member.guild.id) {
      case "804902112700923954": {
        const gifBuffer = await createOkbbWelcomeGif(member);
        const channel = client.channels.cache.get("1128609011852390400");
        const file = new AttachmentBuilder(gifBuffer, { name: "tofoquboolkaro.gif" });
        if (channel?.isSendable()) {
          await channel.send({
            content: `Namaste saar <@${member.user.id}> cummed in sarvar`,
            files: [file],
          });
        }
        break;
      }
      case "883291433925242950": {
        await sendSs(member, client);
        break;
      }
      default:
        break;
    }

    async function sendSs(member: GuildMember, client: Client) {
      let channelId = "883299030359228457";
      let channel = client.channels.cache.get(channelId);
      channel?.isSendable() && channel.send(`**${member.user.tag}** just joined the server!!`);
    }
  },
});
