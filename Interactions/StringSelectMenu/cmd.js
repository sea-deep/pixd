export default {
  name: 'cmd',
  execute: async (interaction) => {
const sel = interaction.values;
const help = {
  content: `**Command List** `,
  tts: false,
components: [
  {
    type: 1,
    components: [
      {
        custom_id: `cmd`,
        placeholder: `Select Category`,
        options: [
          {
            label: `XUV 780 technology`,
            value: `xuv`,
            description: `Top 10 ai gadgets that will change ur life 🤫🤫🤫`,
            emoji: {
              id: `1084739827167154176`,
              name: `XUV`,
              animated: false,
            },
            default: false,
          },
          {
            label: `Image Generation`,
            value: `img`,
            description: `Create fanny images`,
            emoji: {
              id: `1084741002339831839`,
              name: `joyful`,
              animated: false,
            },
            default: false,
          },           
          {
            label: `Mini-games`,
            value: `gam`,
            description: `Some chotte motte games.`,
            emoji: {
              id: `1116349246732521472`,
              name: `minigames`,
              animated: false,
            },
            default: false,
          },
          {
            label: `No-Fap Streak`,
            value: `fap`,
            description: `No-Fap Streak counter!`,
            emoji: {
              id: `1084742439694245928`,
              name: `nofap`,
              animated: false,
            },
            default: false,
          },
          {
            label: `Music`,
            value: `son`,
            description: `Op supar high quality music `,
            emoji: {
              id: `1084743885063991346`,
              name: `music`,
              animated: false,
            },
            default: false,
          },
        ],
        min_values: 0,
        max_values: 1,
        type: 3,
      },
    ],
  },
],
  embeds: [
    {
      type: 'rich',
      title: `Tech Saport`,
      description: `</suggest:000> : Send a message to developer\n~~</subscribe:000> : Get updates!~~`,
      color: 0xbbab30,
      thumbnail: {
        url: 'https://images-ext-2.discordapp.net/external/uFIhM0gaX0cTSdv3zispJ0ffhjOtel4mUcXISBFRgow/https/cdn.discordapp.com/emojis/898562618833383444.gif',
        height: 0,
        width: 0,
      },
    },
  ],
};

if (sel[0] == 'xuv') {
  let com = interaction.message.components[0].components[0].options[0];
  help.embeds[0].thumbnail.url = `https://cdn.discordapp.com/emojis/${com.emoji.id}.png`;
  help.embeds[0].title = com.label;
  help.embeds[0].description = [
    '• `p!gpt` - Lund GPT',
    '• `p!padhaku` - Ask study related questions.',
    '• `p!genesis` - Genesis AI images with prompt.',
    '• `p!genetics <message link> or reply` - Genesis someone.',
    '• `p!actually <message link> or reply` - 🤓 Reaction',
  ].join('\n');
}
if (sel[0] == 'img') {
  let com = interaction.message.components[0].components[0].options[1];
  help.embeds[0].thumbnail.url = `https://cdn.discordapp.com/emojis/${com.emoji.id}.png`;
  help.embeds[0].title = com.label;
  help.embeds[0].description = [
    '• `p!lapata` - Get Lapata.',
    '• `p!rape` - Nirbhaya 👍',
    '• `p!allustuff` - Allu Arjun funnies',
    '• `p!vosahihai` - Hes right you know',
    '• `p!nearyou` - WHO ARE YOU',
    '• `p!goodness` - oh my goonesdness grciousness',
    '• `p!animan` - Put that new forgis on the jeep',
    '• `p!koo` - Make a Koo (Indian twitter).',
  ].join('\n');
}
if (sel[0] == 'gam') {
  let com = interaction.message.components[0].components[0].options[2];
  help.embeds[0].thumbnail.url = `https://cdn.discordapp.com/emojis/${com.emoji.id}.png`;
  help.embeds[0].title = com.label;
  help.embeds[0].description = [
    '• `p!wordle` - Play the game wordle',
    '• `p!c4` - Play the game Connect 4',
    '• `p!2048` - Play 2048',
    '• `p!hangman` - Yet another word guessing game.',
    '**more to come...**',
  ].join('\n');
}
if (sel[0] == 'fap') {
  let com = interaction.message.components[0].components[0].options[3];
  help.embeds[0].thumbnail.url = `https://cdn.discordapp.com/emojis/${com.emoji.id}.png`;
  help.embeds[0].title = com.label;
  help.embeds[0].description = [
    '• `p!addme` - Start your journey',
    '• `p!win` - Add a day in your streak everyday.',
    '• `p!lose` - Reset your streak.',
    "• `p!crstreak` - Check your's or someone else's Streak.",
    '• `p!leaderboard` - See the leaderboard.',
  ].join('\n');
}
if (sel[0] == 'son') {
  let com = interaction.message.components[0].components[0].options[4];
  help.embeds[0].thumbnail.url = `https://cdn.discordapp.com/emojis/${com.emoji.id}.png`;
  help.embeds[0].title = com.label;
  help.embeds[0].description = [
    '• `p!play <query|url> || p!p` - search for a song or enter a YouTube or SoundCloud URL',
    '• `p!pause` - pause the bot.',
    '• `p!resume` - resume the bot.',
    '• `p!stop` - bye bye bot !',
    '• `p!skip <n>` - skips the current song or remove a song from the queue.',
    '• `p!skipto <n>` - skip to a desired position in the queue.',
    '• `p!queue <n>` - shows songs in the queue.',
    '• `p!clear` - removes all songs in the queue.',
    '• `p!shuffle` - shuffles the queue.',
    '• `p!loop` - repeats the queue.',
    '• `p!seek <mm-ss>` - seek to a desired time in the current playing song.',
  ].join('\n');
}
await interaction.deferUpdate();
return interaction.message.edit(help);
  }
};
