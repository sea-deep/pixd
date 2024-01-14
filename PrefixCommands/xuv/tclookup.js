import truecallerjs from "truecallerjs";
import { Client, Message } from "discord.js";

export default {
  name: "truecaller",
  description: "Lookup Truecaller",
  aliases: ["tc"],
  usage: "tc +91XXXXXXZZZX",
  guildOnly: false,
  args: true,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   * @param {Client} client
   */
  execute: async (message, args, client) => {
    let resp = await lookup(args.join(' '));
    return message.reply({
      content: "",
      embeds: [{
        title: args.join(' '),
        description: resp,
      }],
    });
  }
};

async function lookup(number) {
  try {
    const searchData = {
      number: number,
      installationId: process.env.TRUECALLER
    };

    const response = await truecallerjs.search(searchData);

    const r = response?.data?.data[0];

    const data = [
      `**Name**: ${r?.name}`,
      `**City**: ${r?.addresses[0]?.city}, ${response?.getCountryDetails()?.name} ${response?.getCountryDetails()?.flag}`,
      `**Carrier**: ${r?.phones[0]?.carrier}`,
    ].join("\n");

    return data;
  } catch (e) {
    console log("Error occurred? ", e);
  }
}