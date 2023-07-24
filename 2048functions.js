function move(description, direction) {
  const board = parseDesc(description);

  if (!board) {
    throw new Error('Invalid board description');
  }

  let moved = false;

  switch (direction) {
    case 'right':
      for (let row = 0; row < board.length; row++) {
        for (let col = board[row].length - 2; col >= 0; col--) {
          if (board[row][col] !== '0') {
            let nextCol = col + 1;
            while (nextCol < board[row].length && board[row][nextCol] === '0') {
              nextCol++;
            }

            if (nextCol < board[row].length && board[row][col] === board[row][nextCol]) {
              board[row][nextCol] = (parseInt(board[row][col]) * 2).toString();
              board[row][col] = '0';
              moved = true;
            } else if (board[row][nextCol - 1] === '0') {
              board[row][nextCol - 1] = board[row][col];
              board[row][col] = '0';
              moved = true;
            }
          }
        }
      }
      break;

    case 'left':
      for (let row = 0; row < board.length; row++) {
        for (let col = 1; col < board[row].length; col++) {
          if (board[row][col] !== '0') {
            let prevCol = col - 1;
            while (prevCol >= 0 && board[row][prevCol] === '0') {
              prevCol--;
            }

            if (prevCol >= 0 && board[row][col] === board[row][prevCol]) {
              board[row][prevCol] = (parseInt(board[row][col]) * 2).toString();
              board[row][col] = '0';
              moved = true;
            } else if (board[row][prevCol + 1] === '0') {
              board[row][prevCol + 1] = board[row][col];
              board[row][col] = '0';
              moved = true;
            }
          }
        }
      }
      break;

    case 'up':
      for (let col = 0; col < board[0].length; col++) {
        for (let row = 1; row < board.length; row++) {
          if (board[row][col] !== '0') {
            let prevRow = row - 1;
            while (prevRow >= 0 && board[prevRow][col] === '0') {
              prevRow--;
            }

            if (prevRow >= 0 && board[row][col] === board[prevRow][col]) {
              board[prevRow][col] = (parseInt(board[row][col]) * 2).toString();
              board[row][col] = '0';
              moved = true;
            } else if (board[prevRow + 1][col] === '0') {
              board[prevRow + 1][col] = board[row][col];
              board[row][col] = '0';
              moved = true;
            }
          }
        }
      }
      break;

    case 'down':
      for (let col = 0; col < board[0].length; col++) {
        for (let row = board.length - 2; row >= 0; row--) {
          if (board[row][col] !== '0') {
            let nextRow = row + 1;
            while (nextRow < board.length && board[nextRow][col] === '0') {
              nextRow++;
            }

            if (nextRow < board.length && board[row][col] === board[nextRow][col]) {
              board[nextRow][col] = (parseInt(board[row][col]) * 2).toString();
              board[row][col] = '0';
              moved = true;
            } else if (board[nextRow - 1][col] === '0') {
              board[nextRow - 1][col] = board[row][col];
              board[row][col] = '0';
              moved = true;
            }
          }
        }
      }
      break;

    default:
      throw new Error('Invalid direction');
  }

  if (moved) {
    spawnRandom(board, 1);
  }

  return makeDesc(board);
}

function spawnRandom(board, amount) {
  const emptyTiles = [];

  // Find all the empty tiles
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col] === '0') {
        emptyTiles.push([row, col]);
      }
    }
  }

  for (let i = emptyTiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [emptyTiles[i], emptyTiles[j]] = [emptyTiles[j], emptyTiles[i]];
  }

  // Spawn random numbers on the empty tiles
  for (let i = 0; i < amount; i++) {
    const [row, col] = emptyTiles[i];
    const value = Math.random() < 0.8 ? '2' : '4'; // 2 has 80% chance, 4 has 20% chance
    board[row][col] = value;
  }

  return board; // return the modified board
}

function makeDesc(board) {
  const emojiMap = {
    '0': '<:00:1088197427980423319>',
    '2': '<:02:1117786469193486379>',
    '4': '<:04:1117786477204615219>',
    '8': '<:08:1117786482011287612>',
    '16': '<:016:1117786487229001748>',
    '32': '<:032:1117786492270555187>',
    '64': '<:064:1117786496800399402>',
    '256': '<:256:1117786505889464452>',
    '1024': '<:1024:1117786515980963930>',
    '2048': '<:2048:1117786520313659423>',
    '4096': '<:4096:1117786525002911885>',
  };

  const newBoard = board.map((row) => row.map((val) => emojiMap[val]));

  let description = newBoard.map((row) => row.join(' ')).join('\n');

  return description;
}

function parseDesc(description) {
  const array = description.split('\n');

  const board = array.map((row) => row.split(' '));

  const stringMap = {
    '<:00:1088197427980423319>': '0',
    '<:02:1117786469193486379>': '2',
    '<:04:1117786477204615219>': '4',
    '<:08:1117786482011287612>': '8',
    '<:016:1117786487229001748>': '16',
    '<:032:1117786492270555187>': '32',
    '<:064:1117786496800399402>': '64',
    '<:256:1117786505889464452>': '256',
    '<:1024:1117786515980963930>': '1024',
    '<:2048:1117786520313659423>': '2048',
    '<:4096:1117786525002911885>': '4096',
  };

  const newBoard = board.map((row) => row.map((val) => stringMap[val]));

  return newBoard;
}

function calculateScore(board) {
  let score = 0;

  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] !== '0') {
        score += parseInt(board[i][j]);
      }
    }
  }

  return score;
}

function isGameOver(board) {
  // Check if there are any empty tiles on the board
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === '0') {
        return false;
      }
    }
  }

  // Check if there are any adjacent identical tiles on the board
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (j < board[i].length - 1 && board[i][j] === board[i][j + 1]) {
        return false;
      }

      if (i < board.length - 1 && board[i][j] === board[i + 1][j]) {
        return false;
      }
    }
  }

  // If there are no empty tiles or adjacent identical tiles, the game is over
  return true;
}

function message(params) {
  return {
    content: '',
    tts: false,
    components: [
      {
        type: 1,
        components: [
          {
            style: 2,
            custom_id: `empty1`,
            disabled: true,
            emoji: {
              id: null,
              name: `🔴`,
            },
            type: 2,
          },
          {
            style: 1,
            custom_id: `2048_up`,
            disabled: false,
            emoji: {
              id: `1088198768521908306`,
              name: `ArrowUp`,
              animated: false,
            },
            type: 2,
          },
          {
            style: 2,
            custom_id: `empty2`,
            disabled: true,
            emoji: {
              id: null,
              name: `🔴`,
            },
            type: 2,
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            style: 1,
            custom_id: `2048_left`,
            disabled: false,
            emoji: {
              id: `1088199774055972944`,
              name: `ArrowLeft`,
              animated: false,
            },
            type: 2,
          },
          {
            style: 2,
            custom_id: `empty3`,
            disabled: true,
            emoji: {
              id: null,
              name: `🔴`,
            },
            type: 2,
          },
          {
            style: 1,
            custom_id: `2048_right`,
            disabled: false,
            emoji: {
              id: `1088199734092636260`,
              name: `ArrowRight`,
              animated: false,
            },
            type: 2,
          },
        ],
      },
      {
        type: 1,
        components: [
          {
            style: 2,
            custom_id: `empty4`,
            disabled: true,
            emoji: {
              id: null,
              name: `🔴`,
            },
            type: 2,
          },
          {
            style: 1,
            custom_id: `2048_down`,
            disabled: false,
            emoji: {
              id: `1088199643382431836`,
              name: `ArrowDown`,
              animated: false,
            },
            type: 2,
          },
          {
            style: 2,
            custom_id: `empty5`,
            disabled: true,
            emoji: {
              id: null,
              name: `🔴`,
            },
            type: 2,
          },
        ],
      },
    ],
    embeds: [
      {
        type: 'rich',
        title: `2️⃣0️⃣4️⃣8️⃣ Game`,
        description: `${params.description}`,
        color: 0x0e874f,
        fields: [
          {
            name: `Score:`,
            value: `${params.score}`,
            inline: true,
          },
        ],
      },
    ],
  };
}

module.exports = {
  move: move,
  isGameOver: isGameOver,
  spawnRandom: spawnRandom,
  calculateScore: calculateScore,
  parseDesc: parseDesc,
  makeDesc: makeDesc,
  message: message,
};
