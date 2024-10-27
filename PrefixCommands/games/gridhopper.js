import { ButtonInteraction, Client, ComponentType, Message } from "discord.js";

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
        let components = [];
        for (let i = 0; i < 5; i++) {
            components.push({
                type: 1,
                components: []
            });
            for (let j = 0; j < 5; j++) {
                components[i].components[j] = {
                    style: 2,
                    label: `•`,
                    custom_id: `grid_${i}${j}`,
                    disabled: false,
                    type: 2,
                };
            }
        }
        let sentMessage = await message.channel.send({
            content: "",
            components: components
        });

        const collector = sentMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60*5*1000 });
        let currentScore = 1;
        let row = 0, col = 0, prevRow = 0, prevCol = 0;
       // let optionCount = 0, seconds = 0;
        let firstMove = true;
        /**
         * @param {ButtonInteraction} interaction
         */
        collector.on('collect', interaction => {
            console.log(interaction.component.data);
            if (interaction.user.id !== message.member.user.id || interaction.component.data.label !== "•") return;
            if (interaction.component.style == 2 && !firstMove) {
                return gameOver();
            }
            [prevRow, prevCol] = [row, col];
            [row, col] = getSquarePosition(interaction.component.data.custom_id);
          /*  
            if (firstMove) {
                clickedSquare.innerHTML = currentScore++;
                clickedSquare.value = "-";
                highlightValidMoves();
                firstMove = false;
            } else if (clickedSquare.style.backgroundColor !== "white" && isValidMove(Math.abs(row - prevRow), Math.abs(col - prevCol))) {
                clickedSquare.innerHTML = currentScore++;
                clickedSquare.value = "-";
                highlightValidMoves();
            } else {
                endGame();
            }*/
        });
        
    }
};


function getSquarePosition(customId) {
    const value = customId.split("_")[1];
    return [Number(value[0]), Number(value[1])];
}
