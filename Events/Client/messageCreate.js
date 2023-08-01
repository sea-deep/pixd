import { Client, Message } from "discord.js";
import config from "../../Configs/config.js";
import { levenshteinDistance } from "./levenshtein.js"; // Assuming you have a Levenshtein distance function to find the closest match.

const prefix = config.prefix;

export default {
  event: "messageCreate",
  /**
   * @param {Client} client
   * @param {Message} message
   */
  execute: async (message, client) => {
    if (message.content === `<@${client.user.id}>`) {
      message.reply(`**The Prefix is:** \`${prefix}\``);
    }
    if (message.content.toLowerCase().startsWith(prefix) === false) return;
    if (message.author.bot === true) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command =
      client.prefixCommands.get(commandName) ||
      client.prefixCommands.find(
        (cmd) => cmd.aliases[0] !== "" && cmd.aliases.includes(commandName)
      );

    if (!command) {
      // Find the closest matching command
      let closestMatch = null;
      let closestDistance = Infinity;
      for (const cmd of client.prefixCommands.values()) {
        const distance = levenshteinDistance(commandName, cmd.name);
        if (distance < closestDistance) {
          closestMatch = cmd.name;
          closestDistance = distance;
        }
      }
      if (closestMatch) {
        return message.reply(`Did you mean \`${prefix}${closestMatch}\`?`);
      } else return;
    }

    if (command.guildOnly && message.channel.type === "dm") {
      return message.reply("❌ **I can't execute that command inside DMs!**");
    }

    if (command.args && !args.length) {
      let reply = `❌ **You didn't provide any arguments, ${message.author}!**`;
      if (command.usage) {
        reply += `\n**The proper usage would be:** \`${prefix}${command.usage}\``;
      }
      return message.channel.send(reply);
    }

    try {
      command.execute(message, args, client);
    } catch (err) {
      process.stdout.write(`MessageCreate: ${err}\n`);
      message.reply("*There was an error trying to execute that command!*");
    }
  },
};

function levenshteinDistance(s1, s2) {
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  const substitutionCost = s1[s1.length - 1] !== s2[s2.length - 1] ? 1 : 0;

  return Math.min(
    levenshteinDistance(s1.slice(0, -1), s2) + 1,
    levenshteinDistance(s1, s2.slice(0, -1)) + 1,
    levenshteinDistance(s1.slice(0, -1), s2.slice(0, -1)) + substitutionCost
  );
}