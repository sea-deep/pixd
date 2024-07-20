import { Client, Message } from "discord.js";

class ButtonGrid {
  constructor(grid, winnerPositions = []) {
    this.grid = grid;
    this.winnerPositions = winnerPositions;
    this.disableAll = winnerPositions.length > 0;
    this.components = this.createGrid();
  }

  createGrid() {
    let components = [];
    for (let i = 0; i < this.grid.length; i++) {
      let row = {
        type: 1,
        components: []
      };
      for (let j = 0; j < this.grid[i].length; j++) {
        let cell = this.grid[i][j];
        let button = this.createButton(cell, i, j);
        row.components.push(button);
      }
      components.push(row);
    }
    return components;
  }

  createButton(cell, i, j) {
    let button;
    let position = `${i}_${j}`;
    let isWinner = this.winnerPositions.includes(position);

    switch (cell) {
      case 'X':
        button = {
          style: isWinner ? 3 : 1,
          custom_id: `ttt_${i}_${j}`,
          disabled: true,
          emoji: { id: null, name: '❌' },
          type: 2
        };
        break;
      case 'O':
        button = {
          style: isWinner ? 3 : 1,
          custom_id: `ttt_${i}_${j}`,
          disabled: true,
          emoji: { id: null, name: '⭕' },
          type: 2
        };
        break;
      case '-':
        button = {
          style: isWinner ? 3 : 2,
          custom_id: `ttt_${i}_${j}`,
          disabled: this.disableAll,
          emoji: { id: null, name: '🟥' },
          type: 2
        };
        break;
    }
    return button;
  }
}

export default {
  name: "ttt",
  description: "Tictactoe",
  aliases: ["tictactoe"],
  usage: "",
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
    let players = [
      message.author.id,
      (message.mentions.users.size === 0) ? "BOT" : `<@${message.mentions.users.first().id}>`
    ];
    let gameState = [
      ["-", "-", "-"],
      ["-", "-", "-"],
      ["-", "-", "-"]
    ];
    const buttonGrid = new ButtonGrid(gameState);
    const response = await message.reply({
      content: `Turn: <@${players[0]}>`,
      embeds: [{
        title: "⚔️ TicTacToe",
        description: `❌ <@${players[0]}> VS ⭕ ${(players[1] === "BOT") ? "BOT" : `<@${players[1]}>`}`
      }],
      components: buttonGrid.components,
    });

    const collector = response.createMessageComponentCollector({ componentType: 2, time: 300000 });

    collector.on('collect', async i => {
      if (!i.message.content.includes(i.user.id)) return;

      let cell = i.customId.split("_");
      cell.shift();
      cell = cell.map(Number);
      gameState[cell[0]][cell[1]] = `${(players.indexOf(i.user.id) === 0 ? 'X' : 'O')}`;

      let winner = checkWinner(gameState);
      let draw = checkDraw(gameState);

      if (winner) {
        let newGrid = new ButtonGrid(gameState, winner.positions);

        await i.deferUpdate();
        await response.edit({
          content: `${i.user} won!`,
          components: newGrid.components
        });
      } else if (draw) {
        let newGrid = new ButtonGrid(gameState);
        await i.deferUpdate();
        await response.edit({
          content: 'Match draw!',
          components: newGrid.components
        });
      } else if (players[1] === "BOT") {
        let row, col;
        let rows = gameState.length;
        let cols = gameState[0].length;

        do {
          row = Math.floor(Math.random() * rows);
          col = Math.floor(Math.random() * cols);
        } while (gameState[row][col] !== "-");

        gameState[row][col] = "O";
        let winner = checkWinner(gameState);
        let draw = checkDraw(gameState);

        if (winner && winner.winner === "O") {
          let newGrid = new ButtonGrid(gameState, winner.positions);

          await i.deferUpdate();
          await response.edit({
            content: `${i.user} lost!`,
            components: newGrid.components
          });
        } else if (draw) {
          let newGrid = new ButtonGrid(gameState);
          await i.deferUpdate();
          await response.edit({
            content: 'Match draw!',
            components: newGrid.components
          });
        } else {
          let newGrid = new ButtonGrid(gameState);
          await i.deferUpdate();
          await response.edit({
            content: `Turn: <@${i.user.id}>`,
            components: newGrid.components
          });
        }
      } else {
        let nextPlayer = i.user.id === players[0] ? players[1] : players[0];
        let newGrid = new ButtonGrid(gameState);
        await i.deferUpdate();
        await response.edit({
          content: `Turn: <@${nextPlayer}>`,
          components: newGrid.components
        });
      }
    });
  }
};

function checkWinner(gameState) {
  // row
  for (let i = 0; i < 3; i++) {
    if (gameState[i][0] !== '-' && gameState[i][0] === gameState[i][1] && gameState[i][1] === gameState[i][2]) {
      return { winner: gameState[i][0], positions: [`${i}_0`, `${i}_1`, `${i}_2`] };
    }
  }

  // column 
  for (let i = 0; i < 3; i++) {
    if (gameState[0][i] !== '-' && gameState[0][i] === gameState[1][i] && gameState[1][i] === gameState[2][i]) {
      return { winner: gameState[0][i], positions: [`0_${i}`, `1_${i}`, `2_${i}`] };
    }
  }

  // diagonal 1
  if (gameState[0][0] !== '-' && gameState[0][0] === gameState[1][1] && gameState[1][1] === gameState[2][2]) {
    return { winner: gameState[0][0], positions: [`0_0`, `1_1`, `2_2`] };
  }

  // diagonal 2
  if (gameState[0][2] !== '-' && gameState[0][2] === gameState[1][1] && gameState[1][1] === gameState[2][0]) {
    return { winner: gameState[0][2], positions: [`0_2`, `1_1`, `2_0`] };
  }

  return null;
}

function checkDraw(gameState) {
  for (let row of gameState) {
    for (let cell of row) {
      if (cell === "-") {
        return false;
      }
    }
  }
  return true;
}