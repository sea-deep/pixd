import { ButtonInteraction, Client, ComponentType, Message } from "discord.js";

export default {
    name: "gridhopper",
    description: "Grid Hopper Game",
    aliases: ["gh", "grid"],
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
                components: [],
            });
            for (let j = 0; j < 5; j++) {
                components[i].components[j] = {
                    style: 2,
                    label: "•",
                    custom_id: `grid_${i}${j}`,
                    disabled: false,
                    type: 2,
                };
            }
        }

        let sentMessage = await message.channel.send({
            content: "Click squares to start the game!",
            components: components,
        });

        const collector = sentMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 5 * 60 * 1000, // 5 minutes
        });

        let currentScore = 0;
        let row = 0, col = 0, prevRow = 0, prevCol = 0;
        let optionCount = 0;
        let firstMove = true;
        let startTime = Date.now();

        /**
         * @param {ButtonInteraction} interaction
         */
        collector.on("collect", async (interaction) => {
            if (interaction.user.id !== message.member.user.id || interaction.component.label !== "•") return;

            // Update previous position
            [prevRow, prevCol] = [row, col];
            [row, col] = getSquarePosition(interaction.component.customId);

            if (firstMove) {
                currentScore++;
                await updateButton(interaction, currentScore, components, row, col, true);
                firstMove = false;
            } else if (isValidMove(row, col, prevRow, prevCol)) {
                currentScore++;
                await updateButton(interaction, currentScore, components, row, col, true);
            } else {
                await collector.stop();
                return gameOver(sentMessage, currentScore, startTime);
            }

            // Count available moves and end game if none are left
            optionCount = countValidMoves(components, row, col);
            if (optionCount === 0) return gameOver(sentMessage, currentScore, startTime);
        });
    },
};

/**
 * Gets square position from custom ID.
 */
function getSquarePosition(customId) {
    const value = customId.split("_")[1];
    return [Number(value[0]), Number(value[1])];
}

/**
 * Validates the move based on allowed patterns.
 */
function isValidMove(row, col, prevRow, prevCol) {
    const rowDiff = Math.abs(row - prevRow);
    const colDiff = Math.abs(col - prevCol);
    return (
        (rowDiff === 2 && colDiff === 2) ||
        (rowDiff === 3 && colDiff === 0) ||
        (rowDiff === 0 && colDiff === 3)
    );
}

/**
 * Updates button with current score, disables it, and highlights valid moves.
 */
async function updateButton(interaction, score, components, row, col, disableClicked) {
    const clickedButton = components[row].components[col];
    clickedButton.label = String(score);
    clickedButton.style = 1; // Highlight clicked button
    clickedButton.disabled = disableClicked;

    // Highlight valid moves
    components = await highlightValidMoves(components, row, col);

    // Update message with modified components
    await interaction.update({
        components: components,
    });
}

/**
 * Highlights valid moves based on the current square position.
 */
async function highlightValidMoves(components, row, col) {
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const button = components[i].components[j];
            if (
                !button.disabled && (
                    (Math.abs(row - i) === 2 && Math.abs(col - j) === 2) ||
                    (Math.abs(row - i) === 3 && col === j) ||
                    (row === i && Math.abs(col - j) === 3)
                )
            ) {
                button.style = 3; // Set a different style for valid moves
            } else if (!button.disabled) {
                button.style = 2; // Reset style for non-moves
            }
        }
    }
    return components;
}

/**
 * Counts remaining valid moves.
 */
function countValidMoves(components, row, col) {
    let count = 0;
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const button = components[i].components[j];
            if (!button.disabled && (
                (Math.abs(row - i) === 2 && Math.abs(col - j) === 2) ||
                (Math.abs(row - i) === 3 && col === j) ||
                (row === i && Math.abs(col - j) === 3)
            )) {
                count++;
            }
        }
    }
    return count;
}

/**
 * Ends the game and displays score and stats.
 */
function gameOver(sentMessage, currentScore, startTime) {
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const points = (10 * currentScore / Math.sqrt(elapsedTime + 1)).toFixed(1);
    sentMessage.edit({
        content: `GAME OVER\nScore: ${currentScore - 1}\nTime: ${elapsedTime} seconds\nPoints: ${points}`,
    });
}
