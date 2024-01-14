import truecallerjs from "truecallerjs":
import {Client, Message } from "discord.js";

export default {
  name: "truecaller",
  description: "Lookup Truecaller",
  aliases: ["tc"],
  usage: "tc +916289522067",
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
   let resp;
    try {
    resp = await lookup(args.join(' '));
   } catch(e) {return message.reply(”An error occurred...\nMake sure you're putting number in the international format `+91XXXXXXXXXX`"}
    return message.reply({
    content: 
    embeds: [{
     title: args.join(' '),
     description: resp
    }]
   });
  }
};

async function lookup(number) {
  try {
    const searchData = {
      number: number,
      installationId: "a1i0b--kMjadQkMkO4DOIYtdvS2AM2N2x-0Uu6PHN_M3Sd8LFaeNM9B6x76cVrHw",
    };

    const response = await truecallerjs.search(searchData);

    const r = response.data.data[0];

    const data = [
      `**Name**: ${r?.name}`,
      `**City**: ${r.addresses[0].city}, ${response.getCountryDetails().name} ${response.getCountryDetails().flag}`,
      `**Carrier**: ${r.phones[0].carrier}`,
    ].join("\n");

    return data;
  } catch (e) {
    throw new Error("Error occurred", e);
  }
}