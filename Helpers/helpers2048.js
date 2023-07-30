export function move(description, direction) {
  const board = parseDesc(description);

  if (!board) {
    throw new Error('Invalid board description');
  }

  let moved = false;

  switch (direction) {
    case 'right':
      board.forEach((row) => {
        for (let col = row.length - 2; col >= 0; col--) {
          if (row[col] !== '0') {
            let nextCol = col + 1;
            while (nextCol < row.length && row[nextCol] === '0') {
              nextCol++;
            }

            if (nextCol < row.length && row[col] === row[nextCol]) {
              row[nextCol] = (parseInt(row[col]) * 2).toString();
              row[col] = '0';
              moved = true;
            } else if (row[nextCol - 1] === '0') {
              row[nextCol - 1] = row[col];
              row[col] = '0';
              moved = true;
            }
          }
        }
      });
      break;

    case 'left':
      board.forEach((row) => {
        for (let col = 1; col < row.length; col++) {
          if (row[col] !== '0') {
            let prevCol = col - 1;
            while (prevCol >= 0 && row[prevCol] === '0') {
              prevCol--;
            }

            if (prevCol >= 0 && row[col] === row[prevCol]) {
              row[prevCol] = (parseInt(row[col]) * 2).toString();
              row[col] = '0';
              moved = true;
            } else if (row[prevCol + 1] === '0') {
              row[prevCol + 1] = row[col];
              row[col] = '0';
              moved = true;
            }
          }
        }
      });
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

export function spawnRandom(board, amount) {
  const emptyTiles = [];

  // find all the empty tiles
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

  // spawn random numbers on the empty tiles
  for (let i = 0; i < amount; i++) {
    const [row, col] = emptyTiles[i];
    const value = Math.random() < 0.9 ? '2' : '4'; // 2 has 90% chance, 4 has 10% chance
    board[row][col] = value;
  }

  return board; // return the modified board
}

export function makeDesc(board) {
  const emojiMap = {
    '0': '<:0_:1133755630633635952>',
    '2': '<:2_:1133755613172748320>',
    '4': '<:4_:1133755575092646018>',
    '8': '<:8_:1133755647314374746>',
    '16': '<:16:1133755568046231614>',
    '32': '<:32:1133755558575472650>',
    '64': '<:64:1133755656638316544>',
    '256': '<:128:1133755638623764582>',
    '1024': '<:256:1133755585750372442>',
    '2048': '<:512:1133755602934452256>',
    '4096': '<:1024:1133755622173708309>',
  };

  const newBoard = board.map((row) => row.map((val) => emojiMap[val]));

  return newBoard.map((row) => row.join('')).join('\n');
}

export function parseDesc(description) {
  const array = description.split('\n');
  const board = array.map((row) => row.split(/(?<=>)(?=<)/));

  const stringMap = {
    '<:0_:1133755630633635952>': '0',
    '<:2_:1133755613172748320>': '2',
    '<:4_:1133755575092646018>': '4',
    '<:8_:1133755647314374746>': '8',
    '<:16:1133755568046231614>': '16',
    '<:32:1133755558575472650>': '32',
    '<:64:1133755656638316544>': '64',
    '<:128:1133755638623764582>': '256',
    '<:256:1133755585750372442>': '1024',
    '<:512:1133755602934452256>': '2048',
    '<:1024:1133755622173708309>': '4096',
  };

  const newBoard = board.map((row) => row.map((val) => (stringMap[val] ? stringMap[val] : val)));

  return newBoard;
}

export function calculateScore(board) {
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

export function isGameOver(board) {
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

export function message2048(params) {
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
            custom_id: `2048up`,
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
            custom_id: `2048left`,
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
            custom_id: `2048right`,
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
            custom_id: `2048down`,
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
        title: `2️⃣0️⃣4️⃣8️⃣.`,
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


