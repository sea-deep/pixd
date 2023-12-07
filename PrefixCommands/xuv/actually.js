import { Message } from "discord.js";

export default {
  name: "actually",
  description: "React with nerd emotes",
  aliases: ["nerd"],
  usage: "actually [reply]|[message link]",
  guildOnly: true,
  args: false,
  permissions: {
    bot: ["MANAGE_MESSAGES"],
    user: [],
  },
  /**
   * @param {Message} message
   */
  execute: async (message) => {
    return;
    let nerds =
      "<:actually:1085483052962173009> <:inerd:1085486860417110026> <:nerd:1085483964917096520> <:nerdbob:1085483238149070878> <:nerdd:1085486459244527657> <:nerdddd:1085486629902364703> <:nerddddd:1085486964096127028> <:nerdddddd:1085487061986988092> <:nerdy:1085487343663845397> <:nerdyy:1085488754229252237> <:nerdyyy:1085488822650945596> <:nerdyyyy:1085488900065214464> <:nerdyyyyy:1085488991870144512> <:nerdyyyyyy:1085489036749176996> <:nerdyz:1085489094198579200> <:padhaku:1085487174994112532> <:quote:1085483838840516629> <a:nerddd:1085483561404092476> <a:umactually:1085483295069966365> <:chodu:1085490222290190357>";

    let actual = nerds.split(" ");
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

    for (let i = 0; i < actual.length; i++) {
      try {
        if (isLink) {
          let channel = message.client.channels.cache.get(channelID);
          let msg = await channel.messages.fetch(referencedMessageId);
          if (msg) await msg.react(actual[i]);
        } else {
          let msg = await message.channel.messages.fetch(referencedMessageId);
          if (msg) await msg.react(actual[i]);
        }
      } catch (error) {
        console.error("Error reacting to the message:", error);
        break; // Break the loop after the error occurs
      }
    }
  },
};
