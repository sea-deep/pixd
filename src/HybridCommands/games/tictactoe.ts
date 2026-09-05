import type { APIActionRowComponent, APIButtonComponentWithCustomId, ButtonInteraction } from "discord.js";
type Cell = "X" | "O" | "-";
import HybridCommand from "../../structures/HybridCommand.js";
import { Client, Message } from "discord.js";

class ButtonGrid {
  grid: Cell[][];
  winnerPositions: Set<string>;
  disableAll: boolean;
  components: APIActionRowComponent<APIButtonComponentWithCustomId>[];
  constructor(grid: Cell[][], winnerPositions: string[] = []) {
    this.grid = grid;
    this.winnerPositions = new Set(winnerPositions);
    this.disableAll = winnerPositions.length > 0;
    this.components = this.createGrid();
  }

  createGrid(): APIActionRowComponent<APIButtonComponentWithCustomId>[] {
    return this.grid.map((row, i) => ({
      type: 1,
      components: row.map((cell, j) => this.createButton(cell, i, j)),
    }));
  }

  createButton(cell: Cell, i: number, j: number): APIButtonComponentWithCustomId {
    const position = `${i}_${j}`;
    const isWinner = this.winnerPositions.has(position);
    const baseButton = {
      custom_id: `ttt_${i}_${j}`,
      disabled: this.disableAll || cell !== "-",
      type: 2 as const,
    };

    const buttonTypes: Record<Cell, Pick<APIButtonComponentWithCustomId, "style" | "emoji">> = {
      X: { style: isWinner ? 3 : 1, emoji: {  name: "❌" } },
      O: { style: isWinner ? 3 : 1, emoji: {  name: "⭕" } },
      "-": { style: isWinner ? 3 : 2, emoji: {  name: "🟥" } },
    };

    return { ...baseButton, ...buttonTypes[cell] };
  }
}

export default new HybridCommand({
  name: "ttt",
  description: "TicTacToe",
  aliases: ["tictactoe"],
  usage: "",
  guildOnly: true,
  permissions: { bot: [], user: [] },

  /**
   * @param {Message} message
   * @param {Client} client
   */
  options: [{ type: 6, name: "opponent", description: "Play against another user" }],
  execute: async (ctx, client) => {
    const opponent = ctx.options.getUser("opponent");
    const players = [
      ctx.user.id,
      !opponent
        ? "BOT"
        : opponent.id,
    ];
    let gameState: Cell[][] = Array.from({ length: 3 }, () => Array(3).fill("-"));

    const buttonGrid = new ButtonGrid(gameState);
    const response = await ctx.reply({
      content: `Turn: <@${players[0]}>`,
      embeds: [
        {
          title: "⚔️ TicTacToe",
          description: `❌ <@${players[0]}> VS ⭕ ${players[1] === "BOT" ? "BOT" : `<@${players[1]}>`}`,
        },
      ],
      components: buttonGrid.components,
    });

    const collector = response.createMessageComponentCollector({
      componentType: 2,
      time: 300000,
    });

    let processing = false;
    let finished = false;
    let currentPlayer = players[0];
    collector.on("collect", async (i: ButtonInteraction) => {
      if (processing || finished || i.user.id !== currentPlayer) return i.deferUpdate();

      const [, row, col] = i.customId.split("_").map(Number);
      if (!Number.isInteger(row) || !Number.isInteger(col) || gameState[row]?.[col] !== "-") return i.deferUpdate();
      processing = true;
      try {
      gameState[row][col] = players.indexOf(i.user.id) === 0 ? "X" : "O";

      const winner = checkWinner(gameState);
      const draw = checkDraw(gameState);

      if (winner) {
        finished = true;
        collector.stop("win");
        const newGrid = new ButtonGrid(gameState, winner.positions);
        await i.deferUpdate();
        await response.edit({
          content: `${i.user} won!`,
          components: newGrid.components,
        });
      } else if (draw) {
        finished = true;
        collector.stop("draw");
        const newGrid = new ButtonGrid(gameState);
        await i.deferUpdate();
        await response.edit({
          content: "Match draw!",
          components: newGrid.components,
        });
      } else if (players[1] === "BOT") {
        const pos = botPlayer(gameState);
        gameState[pos[0]][pos[1]] = "O";
        const botWinner = checkWinner(gameState);
        if (botWinner || checkDraw(gameState)) { finished = true; collector.stop("end"); }

        const newGrid = new ButtonGrid(gameState, botWinner?.positions);
        await i.deferUpdate();
        await response.edit({
          content: botWinner ? `${i.user} lost!` : finished ? "Match draw!" : `Turn: <@${i.user.id}>`,
          components: newGrid.components,
        });
      } else {
        const nextPlayer = players[0] === i.user.id ? players[1] : players[0];
        currentPlayer = nextPlayer;
        const newGrid = new ButtonGrid(gameState);
        await i.deferUpdate();
        await response.edit({
          content: `Turn: <@${nextPlayer}>`,
          components: newGrid.components,
        });
      }
      } catch {
        finished = true;
        collector.stop("error");
      } finally { processing = false; }
    });
  },
});

function checkWinner(gameState: Cell[][]) {
  const lines = [
    // rows
    [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [2, 0],
      [2, 1],
      [2, 2],
    ],
    // columns
    [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [0, 2],
      [1, 2],
      [2, 2],
    ],
    // diagonals
    [
      [0, 0],
      [1, 1],
      [2, 2],
    ],
    [
      [0, 2],
      [1, 1],
      [2, 0],
    ],
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    if (
      gameState[a[0]][a[1]] !== "-" &&
      gameState[a[0]][a[1]] === gameState[b[0]][b[1]] &&
      gameState[a[0]][a[1]] === gameState[c[0]][c[1]]
    ) {
      return {
        winner: gameState[a[0]][a[1]],
        positions: line.map(([x, y]) => `${x}_${y}`),
      };
    }
  }

  return null;
}

function checkDraw(gameState: Cell[][]) {
  return gameState.flat().every((cell) => cell !== "-");
}

function botPlayer(gameState: Cell[][]) {
  const emptyPlaces: [number, number][] = [];
  const tempGameState = gameState.map((row) => [...row]);

  gameState.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell === "-") emptyPlaces.push([i, j]);
    });
  });

  for (const place of emptyPlaces) {
    tempGameState[place[0]][place[1]] = "O";
    if (checkWinner(tempGameState)) return place;
    tempGameState[place[0]][place[1]] = "-";
    }

  for (const place of emptyPlaces) {
    tempGameState[place[0]][place[1]] = "X";
    if (checkWinner(tempGameState)) return place;
    tempGameState[place[0]][place[1]] = "-";
  }

  return emptyPlaces[Math.floor(Math.random() * emptyPlaces.length)];
}
