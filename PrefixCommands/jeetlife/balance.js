import { Client, Message } from "discord.js";
import User from "../../Utilities/jeetModel.js";
import emote from "../../Configs/emote.js";
export default {
    name: "balance",
    description: "Check your's or someone else's jeetlife balance",
    aliases: ["bal", "paise", "paisa"],
    usage: "paise <@user>",
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
        if (message.mentions.members.size > 0) {
            user = message.mentions.members.first();
        }
        const userData = await User.findOne({ userID: user.id });
        if (!userData) {
            if (user.id !== message.author.id) {
                return message.channel.send({
                    content: `**${user.displayName} has not joined the Jeetlife yet!**\n-# Use any Jeetlife command to join ts.`,
                }
                );
            }
            await message.channel.send({
                content: `**${user.displayName}'s balance**: \`0\` ${emote.paise}`,
                embeds: [{
                    title: 'New User!!',
                    description: `**Welcome to Jeetlife, ${user.displayName}!**\n\n3 new items have been added to your inventory.\n-# User p!inv to see your items`,
                    color: client.color,
                    thumbnail: {
                        url: user.displayAvatarURL({ dynamic: true }),
                    },
                },
                ]
            }
            );

            const newUser = new User({
                userID: user.id,
            });
            await newUser.save();
        } else {
            await message.channel.send({
                content: `**${user.displayName}'s balance**: \`${userData.balance}\` ${emote.paise}`,
            });
        }

    }
};