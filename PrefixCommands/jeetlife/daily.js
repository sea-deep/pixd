import { Message } from "discord.js";
import emote from "../../Configs/emote.js";
import User from "../../Utilities/jeetModel.js";
export default {
    name: "daily",
    description: "Claim your daily jeetlife balance",
    aliases: ["d", "rojgaar"],
    usage: "jeet",
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
        const user = message.author;
        const dailyAmount = 100 + Math.floor(Math.random() * 100);
        const todayDate = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
        //  console.log(todayDate); => 10/10/2025 udiufdoiuwdwdpihwfwq

        const userData = await User.findOne({ userID: user.id });
        if (!userData) {
            let dob = message.author.createdAt.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
            let aadhaarNo = `${message.author.id.slice(0, 4)} ${message.author.id.slice(4, 8)} ${message.author.id.slice(8, 12)}`;
            let panNo = (msg => `${msg.author.username.replace(/[^a-zA-Z]/g, '').toUpperCase().padEnd(5, 'X').slice(0, 5)}${msg.author.id.padStart(4, '0').slice(0, 4)}${msg.author.username.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(-1) || 'X'}`)(message);

            await message.channel.send({
                content: `**You recieve \`${dailyAmount}\` ${emote.paise} as your daily rojgaar**`,
                embeds: [{
                    title: 'New User!!',
                    description: `**Welcome to Jeetlife, ${user.displayName}!**\n\n2 new items have been added to your inventory.\n-# User p!inv to see your items`,
                    color: client.color,
                    thumbnail: {
                        url: user.displayAvatarURL({ dynamic: true }),
                    },
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    style: 3,
                                    custom_id: "idk",
                                    disabled: true,
                                    type: 2,
                                    label: "Select your gender",
                                },
                            ],
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    style: 2,
                                    custom_id: "pajeet",
                                    disabled: false,
                                    label: "Male",
                                    emoji: {
                                        id: null,
                                        name: "♂️"
                                    },
                                    type: 2,
                                },
                                {
                                    style: 2,
                                    custom_id: "pajeeta",
                                    disabled: false,
                                    label: "Female",
                                    emoji: {
                                        id: null,
                                        name: "♀️"
                                    },
                                    type: 2,
                                },
                            ],
                        },
                    ],
                },
                ]
            });

            const newUser = new User({
                userID: user.id,
                balance: dailyAmount,
                dob: dob,
                aadhaarNo: aadhaarNo,
                panNo: panNo,
                lastDaily: todayDate,
            });
            return newUser.save();
        }
        const lastDaily = userData.lastDaily;
        if (lastDaily === todayDate) {
            return message.reply({
                content: `**You have already claimed your daily rojgaar**\n-# Come back tomorrow for more!`,
            });
        }
        await User.updateOne({ userID: user.id }, { $inc: { balance: dailyAmount, lastDaily: todayDate } });

        return message.channel.send({
            content: `**You recieve \`${dailyAmount}\` ${emote.paise} as your daily rojgaar**`,
        });
    },
}