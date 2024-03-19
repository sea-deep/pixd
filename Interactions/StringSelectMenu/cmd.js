export default {
  name: 'cmd',
  execute: async (interaction) => {
const sel = interaction.values;
const help = {
  content: '',
  embeds: [
    {
      type: 'rich',
      title: '',
      description: '',
      footer: {text:'Send me new commands’ suggestions using the /contact command'},
      thumbnail: {
        url: '',
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
    '* `p!gpt <query>` - Lund GPT',
    '* `p!padhaku <query>` - Ask study related questions.',
    '* `p!genesis <prompt>` - Genesis AI images',
    '* `p!ytsum <youtube URL>` - summarise a youtube video'
   ].join('\n');
}
if (sel[0] == 'uti') {
  let com = interaction.message.components[0].components[0].options[1];
  help.embeds[0].thumbnail.url = `https://cdn.discordapp.com/emojis/${com.emoji.id}.png`;
  help.embeds[0].title = com.label;
  help.embeds[0].description = [
    '* `p!ud <word>` - get a word definition from urban dictionary',
    '* `p!img <query>` - search images from google',
    '* `p!lens [image]` - reverse search an image from google',
   ].join('\n');
}
if (sel[0] == 'img') {
  let com = interaction.message.components[0].components[0].options[2];
  help.embeds[0].thumbnail.url = `https://cdn.discordapp.com/emojis/${com.emoji.id}.png`;
  help.embeds[0].title = com.label;
  help.embeds[0].description = [
    '* `p!lapata [image] or <mentions>` - Get Lapata.',
    '* `p!allustuff [image]+[text]` - Allu Arjun funnies',
    '* `p!vosahihai [image] or <mentions>` - Hes right you know',
    '* `p!nearyou [image] or <mention>` - WHO ARE YOU',
    '* `p!goodness [image] or <mention>` - oh my goodness gracious',
    '* `p!animan <4 mentions>` - Put that new forgis on the jeep',
    ].join('\n');
}
if (sel[0] == 'gam') {
  let com = interaction.message.components[0].components[0].options[3];
  help.embeds[0].thumbnail.url = `https://cdn.discordapp.com/emojis/${com.emoji.id}.png`;
  help.embeds[0].title = com.label;
  help.embeds[0].description = [
    '* `p!wordle` - Play the game wordle',
    '* `p!c4` - Play the game Connect 4',
    '* `p!2048` - Play 2048',
    '* `p!hangman` - Yet another word guessing game.',
  ].join('\n');
}
if (sel[0] == 'fap') {
  let com = interaction.message.components[0].components[0].options[4];
  help.embeds[0].thumbnail.url = `https://cdn.discordapp.com/emojis/${com.emoji.id}.png`;
  help.embeds[0].title = com.label;
  help.embeds[0].description = [
    '* `p!addme` - Start your journey',
    '* `p!win` - Add a day in your streak everyday.',
    '* `p!lose` - Reset your streak.',
    '* `p!crstreak` - Check yours or someone else’s Streak.',
    '* `p!leaderboard` - See the leaderboard.',
  ].join('\n');
}
if (sel[0] == 'son') {
  let com = interaction.message.components[0].components[0].options[5];
  help.embeds[0].thumbnail.url = `https://cdn.discordapp.com/emojis/${com.emoji.id}.png`;
  help.embeds[0].title = com.label;
  help.embeds[0].description = [
    '* `p!play <search or url> - play any song or playlist from YouTube, Spotify and SoundCloud.',
    '* `p!pause` - pause the song.',
    '* `p!resume` - resume the song.',
    '* `p!stop` - stop playing and clear queue.',
    '* `p!skip <n or song name>` - skips the current song or remove a song from the queue.',
    '* `p!lyrics <song-name>` - get lyrics of a song',
    '* `p!skipto <n or song name>` - skip to a desired position in the queue.',
    '* `p!queue` - shows songs in the queue.',
    '* `p!clear` - removes all songs in the queue.',
    '* `p!shuffle` - shuffles the queue.',
    '* `p!loop` - repeats the current song.',
    '* `p!seek <mm:ss>` - seek to a desired time in the current playing song.',
  ].join('\n');
}
await interaction.deferUpdate();
return interaction.message.edit(help);
  }
};
