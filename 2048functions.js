function move(description, direction) {
  let board = parseDesc(description);

  if (!board) {
    throw new Error('Invalid board description');
  }

  switch (direction) {
    case 'right':
      mergeRight();
      moveRight();
      break;

    case 'left':
      mergeLeft();
      moveLeft();
      break;

    case 'up':
      mergeUp();
      moveUp();
      break;

    case 'down':
      mergeDown();
      moveDown();
      break;

    default:
      throw new Error('Invalid direction');
  }

  spawnRandom(board, 1);

  return makeDesc(board);

  function mergeRight() {
    for (let row = 0; row < board.length; row++) {
      for (let col = board[row].length - 1; col >= 1; col--) {
        if (board[row][col] !== '0' && board[row][col] === board[row][col - 1]) {
          board[row][col] = (parseInt(board[row][col]) * 2).toString();
          board[row][col - 1] = '0';
        }
      }
    }
  }

  function moveRight() {
    for (let row = 0; row < board.length; row++) {
      for (let col = board[row].length - 1; col >= 1; col--) {
        if (board[row][col] === '0') {
          let currentCol = col;

          while (currentCol >= 1 && board[row][currentCol] === '0') {
            board[row][currentCol] = board[row][currentCol - 1];
            board[row][currentCol - 1] = '0';
            currentCol--;
          }
        }
      }
    }
  }

  function mergeLeft() {
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length - 1; col++) {
        if (board[row][col] !== '0' && board[row][col] === board[row][col + 1]) {
          board[row][col] = (parseInt(board[row][col]) * 2).toString();
          board[row][col + 1] = '0';
        }
      }
    }
  }

  function moveLeft() {
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length - 1; col++) {
        if (board[row][col] === '0') {
          let currentCol = col;

          while (currentCol < board[row].length - 1 && board[row][currentCol] === '0') {
            board[row][currentCol] = board[row][currentCol + 1];
            board[row][currentCol + 1] = '0';
            currentCol++;
          }
        }
      }
    }
  }

  function mergeUp() {
    for (let col = 0; col < board[0].length; col++) {
      for (let row = 0; row < board.length - 1; row++) {
        if (board[row][col] !== '0' && board[row][col] === board[row + 1][col]) {
          board[row][col] = (parseInt(board[row][col]) * 2).toString();
          board[row + 1][col] = '0';
        }
      }
    }
  }

  function moveUp() {
    for (let col = 0; col < board[0].length; col++) {
      for (let row = 0; row < board.length - 1; row++) {
        if (board[row][col] === '0') {
          let currentRow = row;

          while (currentRow < board.length - 1 && board[currentRow][col] === '0') {
            board[currentRow][col] = board[currentRow + 1][col];
            board[currentRow + 1][col] = '0';
            currentRow++;
          }
        }
      }
    }
  }

  function mergeDown() {
    for (let col = 0; col < board[0].length; col++) {
      for (let row = board.length - 1; row >= 1; row--) {
        if (board[row][col] !== '0' && board[row][col] === board[row - 1][col]) {
          board[row][col] = (parseInt(board[row][col]) * 2).toString();
          board[row - 1][col] = '0';
        }
      }
    }
  }

  function moveDown() {
    for (let col = 0; col < board[0].length; col++) {
      for (let row = board.length - 1; row >= 1; row--) {
        if (board[row][col] === '0') {
          let currentRow = row;

          while (currentRow >= 1 && board[currentRow][col] === '0') {
            board[currentRow][col] = board[currentRow - 1][col];
            board[currentRow - 1][col] = '0';
            currentRow--;
          }
        }
      }
    }
  }
}

function spawnRandom(board, amount) {
  const emptyTiles = [];

  // find all the empty tiles
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col] === '0') {
        emptyTiles.push([row, col]);
      }
    }
  }

  // Check if there are enough empty tiles to spawn the required amount
  if (emptyTiles.length < amount) {
    throw new Error('Insufficient empty tiles to spawn random numbers');
  }

  for (let i = emptyTiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [emptyTiles[i], emptyTiles[j]] = [emptyTiles[j], emptyTiles[i]];
  }

  // spawn random numbers on the empty tiles
  for (let i = 0; i < amount; i++) {
    const [row, col] = emptyTiles[i];
    const value = Math.random() < 0.80 ? '2' : '4'; // 2 has 75% chance, 4 has 25% chance
    board[row][col] = value;
  }

  return board; // return the modified board
}


function makeDesc(board)
{
const emojiMap = {
    2: "<:02:1117786469193486379>",
    4: "<:04:1117786477204615219>",
    8: "<:08:1117786482011287612>",
    16: "<:016:1117786487229001748>",
    32: "<:032:1117786492270555187>",
    64: "<:064:1117786496800399402>",
    256: "<:256:1117786505889464452>",
    1024: "<:1024:1117786515980963930>",
    2048: "<:2048:1117786520313659423>",
    4096: "<:4096:1117786525002911885>"
}


  const newBoard =[];

  for (let i = 0; i < board.length; i++)
  {
    const newRow =[];

    for (let j = 0; j < board[i].length; j++)
    {
      const val = board[i][j];

      if (val === '0')
      {
        newRow.push(emojiMap['0']);
      }
      else
      {
        newRow.push(emojiMap[val]);
      }
    }

    newBoard.push(newRow);
  }

  let description = newBoard.map((row) => row.join(' ')).join('\n');

  return description;

}

function parseDesc(description)
{
  const array = description.split('\n');

  const board = array.map((row) =>
  {
    return row.split(' ');
	});

  const stringMap = {
    "<:02:1117786469193486379>": "2",
    "<:04:1117786477204615219>": "4",
    "<:08:1117786482011287612>": "8",
    "<:016:1117786487229001748>": "16",
    "<:032:1117786492270555187>": "32",
    "<:064:1117786496800399402>": "64",
    "<:256:1117786505889464452>": "256",
    "<:1024:1117786515980963930>": "1024",
    "<:2048:1117786520313659423>": "2048",
    "<:4096:1117786525002911885>": "4096"
}


  const newBoard =[];

  for (let i = 0; i < board.length; i++)
  {
    const newRow =[];

    for (let j = 0; j < board[i].length; j++)
    {
      const val = board[i][j];

      if (val === '<:00:1088197427980423319>')
      {
        newRow.push(stringMap['<:00:1088197427980423319>']);
      }
      else
      {
        newRow.push(stringMap[val.toString()]);
      }
    }

    newBoard.push(newRow);
  }

  return newBoard;

}

function calculateScore(board)
{
  let score = 0;

  for (let i = 0; i < board.length; i++)
  {
    for (let j = 0; j < board[i].length; j++)
    {
      if (board[i][j] !== '0')
      {
        score += parseInt(board[i][j]);
      }
    }
  }

  return score;

}

function isGameOver(board)
{
 	// Check if there are any empty tiles on the board

  for (let i = 0; i < board.length; i++)
  {
    for (let j = 0; j < board[i].length; j++)
    {
      if (board[i][j] === '0')
      {
        return false;
      }
    }
  }

 	// Check if there are any adjacent identical tiles on the board

  for (let i = 0; i < board.length; i++)
  {
    for (let j = 0; j < board[i].length; j++)
    {
      if (j < board[i].length - 1 && board[i][j] === board[i][j + 1])
      {
        return false;
      }

      if (i < board.length - 1 && board[i][j] === board[i + 1][j])
      {
        return false;
      }
    }
  }

 	// If there are no empty tiles or adjacent identical tiles, the game is over

  return true;

}

function message(params)
{
  return {
    content: '',
    tts: false,
    components:[

      {
        type: 1,
        components:[

          {
            style: 2,
            custom_id: `empty1`,
            disabled: true,
            emoji:
            {
              id: null,
              name: `🔴`,
            },
            type: 2,
          },
          {
            style: 1,
            custom_id: `2048_up`,
            disabled: false,
            emoji:
            {
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
            emoji:
            {
              id: null,
              name: `🔴`,
            },
            type: 2,
          },
        ],
      },
      {
        type: 1,
        components:[

          {
            style: 1,
            custom_id: `2048_left`,
            disabled: false,
            emoji:
            {
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
            emoji:
            {
              id: null,
              name: `🔴`,
            },
            type: 2,
          },
          {
            style: 1,
            custom_id: `2048_right`,
            disabled: false,
            emoji:
            {
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
        components:[

          {
            style: 2,
            custom_id: `empty4`,
            disabled: true,
            emoji:
            {
              id: null,
              name: `🔴`,
            },
            type: 2,
          },
          {
            style: 1,
            custom_id: `2048_down`,
            disabled: false,
            emoji:
            {
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
            emoji:
            {
              id: null,
              name: `🔴`,
            },
            type: 2,
          },
        ],
      },
    ],
    embeds:[

      {
        type: 'rich',
        title: `2️⃣0️⃣4️⃣8️⃣ Game`,
        description: `${params.description}`,
        color: 0x0e874f,
        fields:[

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

module.exports = { move: move,
  isGameOver: isGameOver,
  spawnRandom: spawnRandom,
  calculateScore: calculateScore,
  parseDesc: parseDesc,
  makeDesc: makeDesc,
  message: message,
};
