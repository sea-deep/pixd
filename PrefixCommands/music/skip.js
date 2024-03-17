import { Client, Message } from "discord.js";

export default {
  name: "skip",
  description: "Skips the current track.",
  aliases: ["next"],
  usage: "skip <number(optional)>",
  guildOnly: true,
  args: false,
  permissions: {
    bot: [],
    user: [],
  },

  /**
   * @param {Message} message
   * @param {Client} client
   */
  execute: async (message, args, client) => {
    let serverQueue = client.queue.get(message.guild.id);
    if (!message.member.voice.channel) {
      return message.react("<:error:1090721649621479506>");
    }

    if (!serverQueue || serverQueue.songs.length === 0) {
      return message.react("<:error:1090721649621479506>");
    }

    if (args.length === 0) {
      serverQueue.player.stop();
      return message.react("<:skip:1090718541143097464>");
    }

    let pos = parseInt(args[0]);
    if (isNaN(pos)) {
      // Skip by keyword
      let query = message.content
        .substring(message.content.indexOf(" "), message.content.length)
        .trim();
      if (args[0] === "last" || args[0] === "end") {
        // Check certain keywords first
        pos = serverQueue.songs.length - 1;
      } else {
        // Otherwise find a match
        const regex = new RegExp(query, "i"); // Case-insensitive regex
        pos = serverQueue.songs.findIndex((s) => regex.test(s.title));
      }

      if (pos < 0) {
        return message.react("<:error:1090721649621479506>");
      }
    } else if (pos > serverQueue.songs.length - 1 || pos < 0) {
      return message.react("<:error:1090721649621479506>"); // Return statement to avoid skipping
    }

    if (pos === 0) {
      serverQueue.player.stop();
      return message.react("<:skip:1090718541143097464>");
    }

message.react("<:skip:1090718541143097464>");
    serverQueue.songs.splice(pos, 1);
    serverQueue.keep = false;
  },
};
