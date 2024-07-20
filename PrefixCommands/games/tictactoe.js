import {Client, Message } from "discord.js";


class ButtonGrid {
  constructor(grid) {
    this.grid = grid;
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
    switch (cell) {
      case 'X':
        button = {
          style: 1,
          custom_id: `ttt_${i}_${j}`,
          disabled: true,
          emoji: { id: null, name: '❌' },
          type: 2
        };
        break;
      case 'O':
        button = {
          style: 1,
          custom_id: `ttt_${i}_${j}`,
          disabled: true,
          emoji: { id: null, name: '⭕' },
          type: 2
        };
        break;
      case '-':
        button = {
          style: 2,
          custom_id: `ttt_${i}_${j}`,
          disabled: false,
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
    	  description: `<@${players[0]}> VS ${players[1]}`
    	}],
    	components: buttonGrid.components,
});

const collector = response.createMessageComponentCollector({ componentType: 2, time: 3000000 });

collector.on('collect', async i => {
  if(!i.message.content.includes(i.user.id)) return;
  let cell = i.customId.split("_");
  cell.shift();
  cell = cell.map(Number);
  gameState[cell[0]][cell[1]] = `${(players.indexOf(i.user.id) === 0 ? 'X' : 'O')}`;
	let newGrid = new ButtonGrid(gameState);
	await message.edit({
	  components: newGrid.components
	});
});
  }
};

