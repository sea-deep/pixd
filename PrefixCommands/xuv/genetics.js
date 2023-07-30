import { Message } from "discord.js";

export default {
  name: "genetics",
  description: "Reacts with genesis emojis",
  aliases: [""],
  usage: "genetics <reply>|<message link>",
  guildOnly: true,
  args: false,
  permissions: {
    bot: ["MANAGE_MESSAGES"],
    user: [],
  },
  /**
   * @param {Message} message
   */
  execute: async (message, args, client) => {
    let gene =
      "<:blenderesis:977906362484916244> <:chipkalesis:975650941372084284> <:dnasis:973574876885573742> <:drawingesis:1019606581740060693> <:femalesis:973991771581333504> <:genesis:1020673182836994088> <:genebro:1020673070777761842> <:genesissfw:1070357577579376750> <:genesusu:979064159398412308> <:genussy:1020676354963935275> <:kushalesis:1019644439997722644> <:thanussy:1020678708329185340> <:thanosis:975616934982860870> <:speechesis:972860630442840116> <a:genesif:975053431091912784>";

    let genesis = gene.split(" ");
    // delete the message that triggered the event
    await message.delete();

    let isLink = false;
    let channelID = message.channelId;
    let referencedMessageId = null;

    if (message.reference) {
      referencedMessageId = message.reference.messageId;
    } else if (message.content.split(" ").length !== 1) {
      isLink = true;
      let msgLink = message.content.split(" ").splice(1).join(" ");
      const regex = /\/(\d+)\/(\d+)$/;
      const match = msgLink.match(regex);
      channelID = match[1];
      referencedMessageId = match[2];
    } else {
      let msg = await message.channel.messages.fetch({ limit: 1 });
      referencedMessageId = msg.first().id;
    }

    for (let i = 0; i < genesis.length; i++) {
      if (isLink) {
        let channel = client.channels.cache.get(channelID);
        channel.messages.fetch(referencedMessageId).then((msg) => msg.react(genesis[i]));
      } else {
        await message.channel.messages.fetch(referencedMessageId).then((msg) => msg.react(genesis[i]));
      }
    }
  },
};
