
const emojiMap = {
  0: "<:0_:1414166764584964156>",
  2: "<:2_:1414166762613772318>",
  4: "<:4_:1414166760508227644>",
  8: "<:8_:1414166757777735710>",
  16: "<:16:1414166754472624149>",
  32: "<:32:1414166752220287066>",
  64: "<:64:1414166749535797299>",
  128: "<:128:1414166746721554472>",
  256: "<:256:1414166743613575286>",
  512: "<:512:1414166737846272060>",
  1024: "<:1024:1414166733752762439>",
  2048: "<:2048:1414166730934194337>",
};

const stringMap = Object.fromEntries(
  Object.entries(emojiMap).map(([num, emote]) => [emote, num])
);

export function move(description, direction) {
  const board = parseDesc(description);

  if (!board) throw new Error("Invalid board description");
  let moved = false;

  switch (direction) {
    case "right":
      board.forEach(row => {
        for (let col = row.length - 2; col >= 0; col--) {
          if (row[col] !== "0") {
            let nextCol = col + 1;
            while (nextCol < row.length && row[nextCol] === "0") nextCol++;
            if (nextCol < row.length && row[col] === row[nextCol]) {
              row[nextCol] = (parseInt(row[col]) * 2).toString();
              row[col] = "0"; moved = true;
            } else if (row[nextCol - 1] === "0") {
              row[nextCol - 1] = row[col];
              row[col] = "0"; moved = true;
            }
          }
        }
      });
      break;

    case "left":
      board.forEach(row => {
        for (let col = 1; col < row.length; col++) {
          if (row[col] !== "0") {
            let prevCol = col - 1;
            while (prevCol >= 0 && row[prevCol] === "0") prevCol--;
            if (prevCol >= 0 && row[col] === row[prevCol]) {
              row[prevCol] = (parseInt(row[col]) * 2).toString();
              row[col] = "0"; moved = true;
            } else if (row[prevCol + 1] === "0") {
              row[prevCol + 1] = row[col];
              row[col] = "0"; moved = true;
            }
          }
        }
      });
      break;

    case "up":
      for (let col = 0; col < board[0].length; col++) {
        for (let row = 1; row < board.length; row++) {
          if (board[row][col] !== "0") {
            let prevRow = row - 1;
            while (prevRow >= 0 && board[prevRow][col] === "0") prevRow--;
            if (prevRow >= 0 && board[row][col] === board[prevRow][col]) {
              board[prevRow][col] = (parseInt(board[row][col]) * 2).toString();
              board[row][col] = "0"; moved = true;
            } else if (board[prevRow + 1][col] === "0") {
              board[prevRow + 1][col] = board[row][col];
              board[row][col] = "0"; moved = true;
            }
          }
        }
      }
      break;

    case "down":
      for (let col = 0; col < board[0].length; col++) {
        for (let row = board.length - 2; row >= 0; row--) {
          if (board[row][col] !== "0") {
            let nextRow = row + 1;
            while (nextRow < board.length && board[nextRow][col] === "0") nextRow++;
            if (nextRow < board.length && board[row][col] === board[nextRow][col]) {
              board[nextRow][col] = (parseInt(board[row][col]) * 2).toString();
              board[row][col] = "0"; moved = true;
            } else if (board[nextRow - 1][col] === "0") {
              board[nextRow - 1][col] = board[row][col];
              board[row][col] = "0"; moved = true;
            }
          }
        }
      }
      break;

    default: throw new Error("Invalid direction");
  }

  if (moved) spawnRandom(board, 1);
  return makeDesc(board);
}

export function spawnRandom(board, amount) {
  const emptyTiles = [];
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col] === "0") emptyTiles.push([row, col]);
    }
  }
  for (let i = emptyTiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [emptyTiles[i], emptyTiles[j]] = [emptyTiles[j], emptyTiles[i]];
  }
  for (let i = 0; i < amount && i < emptyTiles.length; i++) {
    const [row, col] = emptyTiles[i];
    const value = Math.random() < 0.9 ? "2" : "4";
    board[row][col] = value;
  }
  return board;
}

export function makeDesc(board) {
  return board.map(row => row.map(val => emojiMap[val] || val).join("")).join("\n");
}

export function parseDesc(description) {
  const rows = description.split("\n");
  const board = rows.map(r => r.split(/(?<=>)(?=<)/));
  return board.map(row => row.map(val => stringMap[val] || "0"));
}

export function calculateScore(board) {
  return board.flat().reduce((acc, v) => acc + (v !== "0" ? parseInt(v) : 0), 0);
}

export function isGameOver(board) {
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === "0") return false;
      if (j < board[i].length - 1 && board[i][j] === board[i][j + 1]) return false;
      if (i < board.length - 1 && board[i][j] === board[i + 1][j]) return false;
    }
  }
  return true;
}

export function message2048(params) {
  return {
    content: "",
    tts: false,
    components: [
      {
        type: 1,
        components: [
          { style: 2, custom_id: `empty1`, disabled: true, emoji: { id: null, name: `🔴` }, type: 2 },
          { style: 1, custom_id: `2048up`, disabled: false, emoji: { id: `1088198768521908306`, name: `ArrowUp`, animated: false }, type: 2 },
          { style: 2, custom_id: `empty2`, disabled: true, emoji: { id: null, name: `🔴` }, type: 2 },
        ],
      },
      {
        type: 1,
        components: [
          { style: 1, custom_id: `2048left`, disabled: false, emoji: { id: `1088199774055972944`, name: `ArrowLeft`, animated: false }, type: 2 },
          { style: 2, custom_id: `empty3`, disabled: true, emoji: { id: null, name: `🔴` }, type: 2 },
          { style: 1, custom_id: `2048right`, disabled: false, emoji: { id: `1088199734092636260`, name: `ArrowRight`, animated: false }, type: 2 },
        ],
      },
      {
        type: 1,
        components: [
          { style: 2, custom_id: `empty4`, disabled: true, emoji: { id: null, name: `🔴` }, type: 2 },
          { style: 1, custom_id: `2048down`, disabled: false, emoji: { id: `1088199643382431836`, name: `ArrowDown`, animated: false }, type: 2 },
          { style: 2, custom_id: `empty5`, disabled: true, emoji: { id: null, name: `🔴` }, type: 2 },
        ],
      },
    ],
    embeds: [
      {
        type: "rich",
        title: `2️⃣0️⃣4️⃣8️⃣.`,
        description: `${params.description}`,
        color: 0xe08e67,
        fields: [{ name: `Score:`, value: `${params.score}`, inline: true }],
      },
    ],
  };
}
