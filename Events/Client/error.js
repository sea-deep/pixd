import { Client, TextChannel } from "discord.js";
import chalk from 'chalk';

export default {
  event: "error",
  /**  
  * @param {Error} error     
  * @param {Client} client
  */ 
  execute: async (error, client) => {
    client.login(process.env.TOKEN);
    const errorChannelId = '1200865021450801259'; // Use the provided channel ID
    const errorChannel = client.channels.cache.get(errorChannelId);

    if (errorChannel && errorChannel instanceof TextChannel) {
      const userId = '908287391217905684';
      const userMention = `<@${userId}>`;
      const errorMessage = `[${chalk.red("ERROR")}] - An error occurred: ${userMention} ${error}`;
      console.error(error);
      errorChannel.send(errorMessage);
    }
  },
};