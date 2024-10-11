import sharp from "sharp";

const pieceEmoji = {
  pw: { name: "pw", id: "1292698392656609331" },
  pb: { name: "pb", id: "1292698388839534623" },
  bw: { name: "bw", id: "1292698372142141460" },
  bb: { name: "bb", id: "1292698284804145252" },
  nb: { name: "nb", id: "1292698383139475506" },
  nw: { name: "nw", id: "1292698386230804581" },
  rw: { name: "rw", id: "1292698402517286922" },
  rb: { name: "rb", id: "1292698400130732184" },
  qw: { name: "qw", id: "1292698397819801720" },
  qb: { name: "qb", id: "1292698395047235704" },
  kw: { name: "kw", id: "1292698380585140344" },
  kb: { name: "kb", id: "1292698378144059392" },
};

export async function chess2img(board, turn) {
  let overlays = [
    {
      input: `./Assets/chess/${turn}.png`,
      top: 0,
      left: 23,
    },
  ];
if (turn === "b") {
  board = board.reverse();
}
  for (let i = 0; i < 8; i++) {
    if (turn === "b") {
      board[i] = board[i].reverse();
    }
    for (let j = 0; j < 8; j++) {
      let piece = board[i][j];
      if (!board[i][j]) {
        continue;
      }
      overlays.push({
        input: `./Assets/chess/${piece.type}${piece.color}.png`,
        top: i * 50,
        left: j * 50 + 23,
      });
    }
    
  }
  let cb = await sharp(`./Assets/chess/frame${turn}.png`)
    .composite(overlays)
    .png()
    .toBuffer();

  return cb;
}

export async function chessComponents(chess) {
  // const board = chess.board();
  let components = [
    {
      type: 1,
      components: [
        {
          custom_id: "piece_position",
          type: 3,
          options: [],
          placeholder: "Select your piece",
        },
      ],
    },
    {
      type: 1,
      components: [
        {
          disabled: arguments.length == 2,
          custom_id: "piece_destination",
          type: 3,
          options: [
            {
              value: "bla",
              label: "bla",
            },
          ],
          placeholder: "Move to",
        },
      ],
    },
    {
      type: 1,
      components: [
        {
          custom_id: "resign_chess",
          type: 2,
          style: 4,
          label: "Resign",
        },
      ],
    },
  ];

  let pieces = await chess.moves({ verbose: true });
  if (chess.turn() === 'b') {
    pieces = pieces.reverse();
  }
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    const value = piece.from + "_" + piece.piece + piece.color;
    if (
      !components[0].components[0].options.some(
        (option) => option.value === value
      )
    ) {
      components[0].components[0].options.push({
        value: value,
        label: piece.from,
        emoji: pieceEmoji[piece.piece + piece.color],
      });
    }
  }

  if (arguments.length > 2) {
    components[0].components[0].options.find(
      (obj) => obj.value === arguments[2]
    ).default = true;
    let moves = chess.moves({
      square: arguments[2].split("_")[0],
      verbose: true,
    });
    if (chess.turn() === 'b') {
      moves = moves.reverse();
    }
    // console.log(moves)
    if (moves.length > 0) {
      components[1].components[0].options.shift();
      for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        components[1].components[0].options.push({
          value: move.to,
          label: move.to,
        });
      }
    }
  }
  return components;
}

export async function getBotMove(fen, difficulty) {
  const depthMap = {
    easy: 5,
    medium: 10,
    hard: 15
  };

  const depth = depthMap[difficulty] || 10;
  const url = `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=${depth}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.success) {
      const bestMoveString = data.bestmove.split(" ")[1];
      const from = bestMoveString.slice(0, 2); 
      const to = bestMoveString.slice(2);

      return { from, to };
    } else {
      throw new Error(`Error: ${data.data}`);
    }
  } catch (error) {
    console.error("Error fetching best move:", error);
    return null;
  }
}