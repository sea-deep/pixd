const emptyDisk = "<:emptyDisk:1102228471448604823>";
const yellowDisk = "<:yellowDisk:1102228894209294371>";
const redDisk = "<:redDisk:1102229231527809025>";
const winDisk = "<:greenDisk:1117189780082528356>";
const redCircle = "🔴";
const yellowCircle = "🟡";

export async function c4Button(interaction, dropIn) {
  const message = interaction.message;
  const regex = /<@(\d+)>/g; //To extract mentions...
  const mentions = message.content
    .match(regex)
    .map((match) => match.slice(2, -1));

  if (mentions.length === 3 && interaction.member.user.id !== mentions[2]) {
    if (!mentions.includes(interaction.member.user.id)) {
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
  } else if (!mentions.includes(interaction.member.user.id)) {
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

  let components = message.components;
  if (mentions.length === 3) {
    let playerEmote = mentions[0] === mentions[2] ? redDisk : yellowDisk;
    let oppsID = mentions[0] === mentions[2] ? mentions[1] : mentions[0];
    let playerEmoteU = mentions[0] === mentions[2] ? redCircle : yellowCircle;
    let oppsEmote = playerEmote === redDisk ? yellowCircle : redCircle;
    let board = message.embeds[0].description.split("\n");
    let newBoard = drop(board, playerEmote, dropIn);
    let win = isWin(newBoard, playerEmote, 4);
    newBoard = win ? win : newBoard;
    let gameOver = isGameOver(newBoard, emptyDisk);
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
        button.data.style = i === dropIn ? 1 : 2;
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
              emoji: { id: null, name: `↪️` },
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
          type: `rich`,
          description: newBoard.join("\n"),
          color: 0x7289da,
          fields: message.embeds[0].fields,
          title: message.embeds[0].title,
          footer: message.embeds[0].footer,
        },
      ],
      components: components,
    });
  } else {
    let content = message.content.split("\n");
    let userDrop = drop(
      message.embeds[0].description.split("\n"),
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

    let gameOver1 = isGameOver(userDrop, emptyDisk);
    let userWin = isWin(userDrop, redDisk, 4);
    let dropCall = autoDrop(userDrop);
    let newDesc = dropCall.board;
    let gameOver2 = isGameOver(newDesc, emptyDisk);

    let botWin = isWin(newDesc, yellowDisk, 4);
    components = components.map((component, ind) => {
      component.components = component.components.map((button, index) => {
        let i = ind === 1 ? index + 4 : index;
        button.data.style = i == dropCall.columnIndex ? 1 : 2;
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
              emoji: { id: null, name: `↪️` },
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
              emoji: { id: null, name: `↪️` },
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
                emoji: { id: null, name: `↪️` },
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
          type: `rich`,
          description: newDesc.join("\n"),
          color: 0xe08e67,
          fields: message.embeds[0].fields,
          title: message.embeds[0].title,
          footer: message.embeds[0].footer,
        },
      ],
      components: components,
    });
  }
}

function drop(board, playerEmoji, columnIndex) {
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
  return newBoard.join() !== board.join() ? newBoard : false;
}

function isWin(boardArr, player, numToConnect) {
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

function isGameOver(board) {
  for (let i = 0; i < board.length; i++) {
    if (board[i].includes(emptyDisk)) {
      return false;
    }
  }
  return true;
}

function autoDrop(board) {
  const shuffledIndices = shuffleArray([0, 1, 2, 3, 4, 5, 6]);

  // Helper function to count consecutive disks in a row
  const countConsecutive = (
    row,
    col,
    rowDirection,
    colDirection,
    targetDisk,
  ) => {
    let count = 0;
    while (
      row >= 0 &&
      row < board.length &&
      col >= 0 &&
      col < board[row].length &&
      board[row][col] === targetDisk
    ) {
      count++;
      row += rowDirection;
      col += colDirection;
    }
    return count;
  };

  // Helper function to analyze opponent's playing style
  function analyzeOpponentStyle() {
    const opponentMoves = board.flat().filter((disk) => disk !== emptyDisk);

    const consecutiveMoves = [];

    for (let i = 0; i < opponentMoves.length; i++) {
      const currentMove = opponentMoves[i];
      const previousMove = consecutiveMoves[consecutiveMoves.length - 1];

      if (currentMove === previousMove) {
        consecutiveMoves.push(currentMove);
      } else {
        consecutiveMoves.length = 0;
        consecutiveMoves.push(currentMove);
      }

      if (consecutiveMoves.length >= 3) {
        return "aggressive";
      }
    }

    // If the opponent has frequently blocked potential winning moves
    const potentialWinMoves = consecutiveMoves.filter(
      (move) => move === yellowDisk,
    );
    if (potentialWinMoves.length > 2) {
      return "defensive";
    }

    // If the opponent's moves appear random or unpredictable
    if (opponentMoves.length > 5 && opponentMoves.length % 2 === 1) {
      return "random";
    }

    // If the opponent's style cannot be determined
    return "unknown";
  }

  // Helper function to block opponent's potential winning moves
  function blockOpponentWinningMove(disk) {
    for (let col = 0; col < 7; col++) {
      const testBoard = drop(board, disk, col);
      if (isWin(testBoard, disk, 4)) {
        return { board: testBoard, columnIndex: col };
      }
    }
    return null;
  }

  // Helper function to evaluate the board and find the best move
  function findBestMove(disk) {
    let bestMove = -1;
    let bestScore = -Infinity;

    for (let col = 0; col < 7; col++) {
      const testBoard = drop(board, disk, col);
      const score = evaluateBoard(testBoard, disk);
      if (score > bestScore) {
        bestScore = score;
        bestMove = col;
      }
    }

    return bestMove;
  }

  // Helper function to evaluate the board state based on its advantage for a given player
  function evaluateBoard(board, disk) {
    // Check for potential winning lines in all directions
    const directions = [
      [1, 0], // Vertical
      [0, 1], // Horizontal
      [1, 1], // Diagonal (down-right)
      [-1, 1], // Diagonal (up-right)
    ];

    let score = 0;

    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        if (board[row][col] === emptyDisk) {
          for (const direction of directions) {
            const [rowDirection, colDirection] = direction;
            const opponentDisk = disk === yellowDisk ? redDisk : yellowDisk;

            const consecutivePlayerDisks = countConsecutive(
              row,
              col,
              rowDirection,
              colDirection,
              disk,
            );
            const consecutiveOpponentDisks = countConsecutive(
              row,
              col,
              rowDirection,
              colDirection,
              opponentDisk,
            );

            // Evaluate the advantage based on the consecutive disks in a row
            if (consecutivePlayerDisks === 4) {
              // Winning move
              score += 100;
            } else if (
              consecutivePlayerDisks === 3 &&
              consecutiveOpponentDisks === 0
            ) {
              // Potential winning move (3 player disks, no opponent disks)
              score += 10;
            } else if (
              consecutivePlayerDisks === 2 &&
              consecutiveOpponentDisks === 0
            ) {
              // Advantageous move (2 player disks, no opponent disks)
              score += 5;
            } else if (
              consecutiveOpponentDisks === 3 &&
              consecutivePlayerDisks === 0
            ) {
              // Block opponent's potential winning move (3 opponent disks, no player disks)
              score -= 20;
            }
          }
        }
      }
    }

    return score;
  }

  // Check for winning moves for both players
  for (let i = 0; i < 7; i++) {
    const index = shuffledIndices[i];

    // Check if dropping a yellow disk in column index results in a win
    const testBoard1 = drop(board, yellowDisk, index);
    if (isWin(testBoard1, yellowDisk, 4)) {
      return { board: testBoard1, columnIndex: index };
    }

    // Check if dropping a red disk in column index results in a win for the human
    const testBoard2 = drop(board, redDisk, index);
    if (isWin(testBoard2, redDisk, 4)) {
      return { board: testBoard1, columnIndex: index };
    }
  }

  shuffleArray(shuffledIndices);

  for (let i = 0; i < 7; i++) {
    const index = shuffledIndices[i];

    const testBoard3 = drop(board, yellowDisk, index);
    if (isWin(testBoard3, yellowDisk, 3)) {
      return { board: testBoard3, columnIndex: index };
    }
  }

  shuffleArray(shuffledIndices);

  for (let i = 0; i < 7; i++) {
    const index = shuffledIndices[i];

    const testBoard4 = drop(board, yellowDisk, index);
    if (isWin(testBoard4, yellowDisk, 2)) {
      return { board: testBoard4, columnIndex: index };
    }
  }

  const opponentStyle = analyzeOpponentStyle();
  if (opponentStyle === "aggressive") {
    const randomCol = shuffledIndices[Math.floor(Math.random() * 7)];
    return {
      board: drop(board, yellowDisk, randomCol),
      columnIndex: randomCol,
    };
  } else if (opponentStyle === "defensive") {
    const blockMove = blockOpponentWinningMove(redDisk);
    if (blockMove) {
      return blockMove;
    }
  }

  const bestMove = findBestMove(yellowDisk);
  return { board: drop(board, yellowDisk, bestMove), columnIndex: bestMove };
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
