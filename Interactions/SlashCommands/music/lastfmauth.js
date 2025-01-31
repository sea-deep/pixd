export default {
    data: {
        name: "lastfm",
        description: "Login with Last.fm ",
    },
    execute: async (interaction, client) => {
        await interaction.deferReply({
            ephemeral: true,
        });
        const baseUrl = "http://www.last.fm/api/auth/";
        const params = new URLSearchParams({
            api_key: process.env.LASTFM_KEY,
            cb: `https://pixd.onrender.com/lastfm/login?userid=${interaction.member.id}`,
        });

        const authUrl = `${baseUrl}?${params.toString()}`;
        try {
            return interaction.followUp({
                ephemeral: true,
                content: "",
                embeds: [
                    {
                        description:
                            "**Click the button below to authorise your Last.fm account with PIXD.**",
                        color: client.color,
                    },
                ],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                style: 5,
                                label: `LOGIN WITH LAST.FM`,
                                url: authUrl,
                                disabled: false,
                                type: 2,
                            },
                        ],
                    },
                ],
            });
        } catch (e) {
            console.error("Error while sending ephemeral in /lastf command")
        }
    }
}