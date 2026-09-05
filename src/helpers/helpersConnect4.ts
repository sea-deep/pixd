import type { ButtonInteraction } from "discord.js";
const emptyDisk = "<:emptyDisk:1102228471448604823>";
const yellowDisk = "<:yellowDisk:1102228894209294371>";
const redDisk = "<:redDisk:1102229231527809025>";
const winDisk = "<:greenDisk:1117189780082528356>";
const redCircle = "🔴";
const yellowCircle = "🟡";

export async function c4Button(interaction: ButtonInteraction, dropIn: number) {
  const message = interaction.message;
  const regex = /<@(\d+)>/g; //To extract mentions...
  const mentions = message.content
    .match(regex)!
    .map((match) => match.slice(2, -1));

  if (mentions.length === 3 && interaction.user.id !== mentions[2]) {
    if (!mentions.includes(interaction.user.id)) {
      return interaction.followUp({
        content: "",
        ephemeral: true,
        embeds: [
          {
            description: `❌ **This is not your game**`,
            color: 0xe08e67,
          },
        ],
      });
    } else {
      return interaction.followUp({
        content: "",
        ephemeral: true,
        embeds: [
          {
            description: `❌ **This is not your turn**`,
            color: 0xe08e67,
          },
        ],
      });
    }
  } else if (!mentions.includes(interaction.user.id)) {
    return interaction.followUp({
      content: "",
      ephemeral: true,
      embeds: [
        {
          description: `❌ **This is not your game**`,
          color: 0xe08e67,
        },
      ],
    });
  }

  let components = message.components.filter(row => row.type === 1).map(row => ({ type: 1 as const, components: row.components.filter(button => button.type === 2).map(button => button.toJSON()) }));
  if (mentions.length === 3) {
    let playerEmote = mentions[0] === mentions[2] ? redDisk : yellowDisk;
    let oppsID = mentions[0] === mentions[2] ? mentions[1] : mentions[0];
    let playerEmoteU = mentions[0] === mentions[2] ? redCircle : yellowCircle;
    let oppsEmote = playerEmote === redDisk ? yellowCircle : redCircle;
    let board = message.embeds[0].description!.split("\n");
    let newBoard = drop(board, playerEmote, dropIn);
    let win = isWin(newBoard, playerEmote, 4);
    newBoard = win ? win : newBoard;
    let gameOver = isGameOver(newBoard);
    let content = message.content.split("\n");
    content[1] = win
      ? `And ${playerEmoteU}<@${mentions[2]}> **won**!`
      : gameOver
        ? `**And it's a draw**!`
        : `**Your turn** ${oppsEmote}<@${oppsID}> :`;

    if (!newBoard) {
      return interaction.followUp({
        content: "",
        ephemeral: true,
        embeds: [
          {
            description: `❌ **This column is already filled.**`,
            color: 0xe08e67,
          },
        ],
      });
    }
    components = components.map((component, ind) => {
      component.components = component.components.map((button, index) => {
        let i = ind === 1 ? index + 4 : index;
        button.style = i === dropIn ? 1 : 2;
        return button;
      });
      return component;
    });

    if (gameOver || win) {
      components = [
        {
          type: 1,
          components: [
            {
              label: "Rematch",
              style: 1,
              custom_id: `rematchC4`,
              disabled: false,
              emoji: {  name: `↪️` },
              type: 2,
            },
          ],
        },
      ];
    }
    await message.edit({
      content: `${content.join("\n")}`,
      embeds: [
        {
          description: newBoard.join("\n"),
          color: 0x7289da,
          fields: message.embeds[0].fields,
          title: message.embeds[0].title ?? undefined,
          footer: message.embeds[0].toJSON().footer,
        },
      ],
      components: components,
    });
  } else {
    let content = message.content.split("\n");
    let userDrop = drop(
      message.embeds[0].description!.split("\n"),
      redDisk,
      dropIn,
    );
    if (!userDrop) {
      return interaction.followUp({
        content: "",
        ephemeral: true,
        embeds: [
          {
            description: `❌ **This column is already filled.**`,
            color: 0xe08e67,
          },
        ],
      });
    }

    let gameOver1 = isGameOver(userDrop);
    let userWin = isWin(userDrop, redDisk, 4);
    let dropCall = userWin || gameOver1 ? { board: userDrop, columnIndex: -1 } : autoDrop(userDrop);
    let newDesc = dropCall.board;
    let gameOver2 = isGameOver(newDesc);

    let botWin = isWin(newDesc, yellowDisk, 4);
    components = components.map((component, ind) => {
      component.components = component.components.map((button, index) => {
        let i = ind === 1 ? index + 4 : index;
        button.style = i == dropCall.columnIndex ? 1 : 2;
        return button;
      });
      return component;
    });

    if (userWin) {
      content[1] = `And ${redCircle}you **won**.`;
      components = [
        {
          type: 1,
          components: [
            {
              label: "Rematch",
              style: 1,
              custom_id: `rematchC4`,
              disabled: false,
              emoji: {  name: `↪️` },
              type: 2,
            },
          ],
        },
      ];
    }
    if (botWin) {
      content[1] = `And ${redCircle}you **lost** 🤣.`;
      components = [
        {
          type: 1,
          components: [
            {
              label: "Rematch",
              style: 1,
              custom_id: `rematchC4`,
              disabled: false,
              emoji: {  name: `↪️` },
              type: 2,
            },
          ],
        },
      ];
    }
    if (gameOver1 || gameOver2) {
      (content[1] = `**And it's a draw**!`),
        (components = [
          {
            type: 1,
            components: [
              {
                label: "Rematch",
                style: 1,
                custom_id: `rematchC4`,
                disabled: false,
                emoji: {  name: `↪️` },
                type: 2,
              },
            ],
          },
        ]);
    }

    newDesc = userWin ? userWin : botWin ? botWin : newDesc;

    return message.edit({
      content: content.join("\n"),
      embeds: [
        {
          description: newDesc.join("\n"),
          color: 0xe08e67,
          fields: message.embeds[0].fields,
          title: message.embeds[0].title ?? undefined,
          footer: message.embeds[0].toJSON().footer,
        },
      ],
      components: components,
    });
  }
}

function drop(board: string[], playerEmoji: string, columnIndex: number) {
  // Split each row into an array of cells
  const rows = board.map((row) => row.split(/(?<=>)(?=<)/));
  // Iterate through rows from the bottom up
  for (let rowIndex = rows.length - 1; rowIndex >= 0; rowIndex--) {
    // If an empty cell is found, place the player's disk
    if (rows[rowIndex][columnIndex] === emptyDisk) {
      rows[rowIndex][columnIndex] = playerEmoji;
      break;
    }
  }
  // Reconstruct the board after the move
  let newBoard = rows.map((row) => row.join(""));
  // If the board has changed, return the new board; otherwise, return false
  if (newBoard.join() === board.join()) throw new Error("This column is already filled.");
  return newBoard;
}

function isWin(boardArr: string[], player: string, numToConnect: number) {
  let winningEmoji = winDisk;
  if (!boardArr) {
    return false;
  }
  // Split the board into an array of cells
  const board = boardArr.map((row) => row.split(/(?<=>)(?=<)/));
  const numRows = board.length;
  const numCols = board[0].length;

  // Check rows for a win
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col <= numCols - numToConnect; col++) {
      let found = true;
      for (let i = 0; i < numToConnect; i++) {
        if (board[row][col + i] !== player) {
          found = false;
          break;
        }
      }
      if (found) {
        // Replace player emoji with winning emoji
        for (let i = 0; i < numToConnect; i++) {
          board[row][col + i] = winningEmoji;
        }
        return board.map((line) => line.join(""));
      }
    }
  }

  // Check columns for a win
  for (let row = 0; row <= numRows - numToConnect; row++) {
    for (let col = 0; col < numCols; col++) {
      let found = true;
      for (let i = 0; i < numToConnect; i++) {
        if (board[row + i][col] !== player) {
          found = false;
          break;
        }
      }
      if (found) {
        // Replace player emoji with winning emoji
        for (let i = 0; i < numToConnect; i++) {
          board[row + i][col] = winningEmoji;
        }
        return board.map((line) => line.join(""));
      }
    }
  }

  // Check diagonal (northeast to southwest) for a win
  for (let row = numToConnect - 1; row < numRows; row++) {
    for (let col = 0; col <= numCols - numToConnect; col++) {
      let found = true;
      for (let i = 0; i < numToConnect; i++) {
        if (board[row - i][col + i] !== player) {
          found = false;
          break;
        }
      }
      if (found) {
        // Replace player emoji with winning emoji
        for (let i = 0; i < numToConnect; i++) {
          board[row - i][col + i] = winningEmoji;
        }
        return board.map((line) => line.join(""));
      }
    }
  }

  // Check diagonal (northwest to southeast) for a win
  for (let row = numToConnect - 1; row < numRows; row++) {
    for (let col = numToConnect - 1; col < numCols; col++) {
      let found = true;
      for (let i = 0; i < numToConnect; i++) {
        if (board[row - i][col - i] !== player) {
          found = false;
          break;
        }
      }
      if (found) {
        // Replace player emoji with winning emoji
        for (let i = 0; i < numToConnect; i++) {
          board[row - i][col - i] = winningEmoji;
        }
        return board.map((line) => line.join(""));
      }
    }
  }

  // If no win is found, return false
  return false;
}

function isGameOver(board: string[]) {
  for (let i = 0; i < board.length; i++) {
    if (board[i].includes(emptyDisk)) {
      return false;
    }
  }
  return true;
}

function autoDrop(board: string[]): { board: string[]; columnIndex: number } {
  const columns = [3, 2, 4, 1, 5, 0, 6].filter(column => board[0].split(/(?<=>)(?=<)/)[column] === emptyDisk);
  if (!columns.length) return { board, columnIndex: -1 };
  for (const disk of [yellowDisk, redDisk]) {
    for (const column of columns) {
      const next = drop(board, disk, column);
      if (isWin(next, disk, 4)) return { board: drop(board, yellowDisk, column), columnIndex: column };
    }
  }
  return { board: drop(board, yellowDisk, columns[0]), columnIndex: columns[0] };
}
