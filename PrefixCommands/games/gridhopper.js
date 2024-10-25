import {Client, Message } from "discord.js";

export default {
    name: "gridhopper",
    description: "",
    aliases: ["gh", 'grid'],
    usage: "gh",
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
        let components = [
            {
                type: 1,
                components: [
                    {
                        style: 2,
                        label: `ENTER`,
                        custom_id: `guessWordle`,
                        disabled: false,
                        emoji: {
                            id: null,
                            name: `🖋️`,
                        },
                        type: 2,
                    },
                ],
            },
            {
                type: 1,
                components: [
                    {
                        style: 4,
                        label: `How to play?`,
                        custom_id: `htpWordle`,
                        disabled: false,
                        emoji: {
                            id: null,
                            name: `❓`,
                        },
                        type: 2,
                    },
                ],
            },
        ];


    }
};
