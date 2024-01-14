import { Client, Message } from "discord.js";

export default {
  name: "truecaller",
  description: "Lookup Truecaller",
  aliases: ["tc"],
  usage: "tc +91XXXXXZZZZZ",
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
    let resp = await lookup(args.join(''));
    return message.reply({
      content: "",
      embeds: [{
        title: args.join(''),
        description: resp,
      }],
    });
  }
};

async function lookup(number) {
  const url = "https://search5-noneu.truecaller.com/v2/search";
  const headers = {
    "user-agent": "Truecaller/11.75.5 (Android;10)",
    Authorization:
      "Bearer "+ process.env['TRUECALLER'],
  };
  const params = {
    q: number,
    type: 4,
    locAddr: "",
    placement: "SEARCHRESULTS,HISTORY,DETAILS",
    encoding: "json",
  };

  try {
    const response = await fetch(
      `${url}?${new URLSearchParams(params).toString()}`,
      {
        method: "GET",
        headers: headers,
      },
    );

    const data = await response.json();
    //  console.log(JSON.stringify(data.data[0], null, 2))
    let r = data.data[0];
    let out = [
      `**Name**: ${r?.name}`,
      `**City**: ${r?.addresses[0]?.city}, ${r?.phones[0].countryCode}`,
      `**Carrier**: ${r?.phones[0]?.carrier}`,
    ].join("\n");
    return out;
  } catch (error) {
    console.error("Error:", error.message);
  }
}
