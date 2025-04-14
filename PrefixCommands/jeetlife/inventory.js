import { Client, Message } from "discord.js";
import emote from "../../Configs/emote.js";
import User from "../../Utilities/jeetModel.js";
import { composer } from "googleapis/build/src/apis/composer/index.js";

export default {
    name: "invenory",
    description: "See your jeetlife inventory",
    aliases: ["inv", "items"],
    usage: "inv",
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
        let user = message.author;
        let userData = await User.findOne({ userID: user.id });
        if (!userData) {
            const newUser = new User({
                userID: user.id,
            });
            await newUser.save();
            const inventory = newUser.inventory.map((item, index) => `${index + 1}. ${item.icon} ${item.itemName} \`x${item.amount}\``).join("\n");

            await message.channel.send({
                content: `**${user.displayName}'s inventory**`,
                embeds: [{
                    title: "New User!!",
                    description: `**Welcome to Jeetlife, ${user.displayName}!**\n` + inventory + "\n-# User p!use <item-number> to use an item",
                    color: client.color,
                    thumbnail: {
                        url: "https://www.clipartmax.com/png/middle/347-3475012_inventory-png-photos-inventory-icon-free.png",
                    },
                }]
            });

        } else {
            const inventory = userData.inventory.map((item, index) => `${index + 1}. ${item.icon} ${item.itemName} \`x${item.amount}\``).join("\n");
            await message.channel.send({
                content: `**${user.displayName}'s inventory**`,
                embeds: [{
                    thumbnail: {
                        url: "https://www.clipartmax.com/png/middle/347-3475012_inventory-png-photos-inventory-icon-free.png",
                    },
                    description: inventory + "\n-# User p!use <item-number> to use an item",
                    color: client.color,
                }]
            });
        }
    }
};