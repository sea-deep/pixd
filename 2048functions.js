function move(description, direction)
{
  let board = parseDesc(description);

  switch (direction)
  {
    case 'right':

      board = moveRight(board);

      break;

    case 'left':

      board = moveLeft(board);

      break;

    case 'up':

      board = moveUp(board);

      break;

    case 'down':

      board = moveDown(board);

      break;
  }

  board = spawnRandom(board, 1);

  function moveRight(board)
  {
    for (let row = 0; row < board.length; row++)
    {
     	// slide all non-empty tiles to the right

      for (let col = board[row].length - 2; col >= 0; col--)
      {
        if (board[row][col] !== '0')
        {
          let currentCol = col;

          while (
            currentCol + 1 < board[row].length &&

            board[row][currentCol + 1] === '0'

         )
          {
            board[row][currentCol + 1] = board[row][currentCol];

            board[row][currentCol] = '0';

            currentCol++;
          }
        }
      }

     	// merge adjacent identical tiles from right to left

      for (let col = board[row].length - 2; col >= 0; col--)
      {
        if (
          board[row][col] !== '0' &&

          board[row][col] === board[row][col + 1]

       )
        {
          board[row][col + 1] = (parseInt(board[row][col]) *2).toString();

          board[row][col] = '0';
        }
      }
    }

    return board;
  }

  function moveLeft(board)
  {
    for (let row = 0; row < board.length; row++)
    {
     	// slide all non-empty tiles to the left

      for (let col = 1; col < board[row].length; col++)
      {
        if (board[row][col] !== '0')
        {
          let currentCol = col;

          while (currentCol - 1 >= 0 && board[row][currentCol - 1] === '0')
          {
            board[row][currentCol - 1] = board[row][currentCol];

            board[row][currentCol] = '0';

            currentCol--;
          }
        }
      }

     	// merge adjacent identical tiles from left to right

      for (let col = 1; col < board[row].length; col++)
      {
        if (
          board[row][col] !== '0' &&

          board[row][col] === board[row][col - 1]

       )
        {
          board[row][col - 1] = (parseInt(board[row][col]) *2).toString();

          board[row][col] = '0';
        }
      }
    }

    return board;
  }

  function moveUp(board)
  {
    for (let col = 0; col < board[0].length; col++)
    {
     	// slide all non-empty tiles upwards

      for (let row = 1; row < board.length; row++)
      {
        if (board[row][col] !== '0')
        {
          let currentRow = row;

          while (currentRow - 1 >= 0 && board[currentRow - 1][col] === '0')
          {
            board[currentRow - 1][col] = board[currentRow][col];

            board[currentRow][col] = '0';

            currentRow--;
          }
        }
      }

     	// merge adjacent identical tiles from top to bottom

      for (let row = 1; row < board.length; row++)
      {
        if (
          board[row][col] !== '0' &&

          board[row][col] === board[row - 1][col]

       )
        {
          board[row - 1][col] = (parseInt(board[row][col]) *2).toString();

          board[row][col] = '0';
        }
      }
    }

    return board;
  }

  function moveDown(board)
  {
    for (let col = 0; col < board[0].length; col++)
    {
     	// slide all non-empty tiles downwards

      for (let row = board.length - 2; row >= 0; row--)
      {
        if (board[row][col] !== '0')
        {
          let currentRow = row;

          while (
            currentRow + 1 < board.length &&

            board[currentRow + 1][col] === '0'

         )
          {
            board[currentRow + 1][col] = board[currentRow][col];

            board[currentRow][col] = '0';

            currentRow++;
          }
        }
      }

     	// merge adjacent identical tiles from bottom to top

      for (let row = board.length - 2; row >= 0; row--)
      {
        if (
          board[row][col] !== '0' &&

          board[row][col] === board[row + 1][col]

       )
        {
          board[row + 1][col] = (parseInt(board[row][col]) *2).toString();

          board[row][col] = '0';
        }
      }
    }

    return board;
  }

  return makeDesc(board);

}

function spawnRandom(board, amount)
{
  const emptyTiles =[];

 	// find all the empty tiles

  for (let row = 0; row < board.length; row++)
  {
    for (let col = 0; col < board[row].length; col++)
    {
      if (board[row][col] === '0')
      {
        emptyTiles.push([row, col]);
      }
    }
  }

  for (let i = emptyTiles.length - 1; i > 0; i--)
  {
    const j = Math.floor(Math.random() *(i + 1));

   [emptyTiles[i], emptyTiles[j]] =[emptyTiles[j], emptyTiles[i]];
  }

 	// spawn random numbers on the empty tiles

  for (let i = 0; i < amount; i++)
  {
    const[row, col] = emptyTiles[i];

    const value = Math.random() < 0.75 ? '2' : '4';	// 2 has 75% chance, 4 has 25% chance

    board[row][col] = value;
  }

  return board;	// return the modified board

}

function makeDesc(board)
{
  const emojiMap = { 0: '<:00:1088197427980423319>',
    2: '<:02:1088197422511050832>',
    4: '<:04:1088197414801907803>',
    8: '<:08:1088197408380432384>',
    16: '<:16:1088197401963135096>',
    32: '<:32:1088197395621351475>',
    64: '<:64:1088197388033867877>',
    128: '<:128:1088197380710617189>',
    256: '<:256:1088201827700449340>',
    512: '<:512:1088197372628185178>',
    1024: '<:1024:1088197363304239114>',
    2048: '<:2048:1088197356962451588>',
    4096: '<:4096:1088197350691983452>',
  };

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

  const stringMap = { '<:00:1088197427980423319>': '0',
    '<:02:1088197422511050832>': '2',
    '<:04:1088197414801907803>': '4',
    '<:08:1088197408380432384>': '8',
    '<:16:1088197401963135096>': '16',
    '<:32:1088197395621351475>': '32',
    '<:64:1088197388033867877>': '64',
    '<:128:1088197380710617189>': '128',
    '<:256:1088201827700449340>': '256',
    '<:512:1088197372628185178>': '512',
    '<:1024:1088197363304239114>': '1024',
    '<:2048:1088197356962451588>': '2048',
    '<:4096:1088197350691983452>': '4096',
  };

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
