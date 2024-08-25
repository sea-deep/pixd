export default {
  name: "cmd",
  execute: async (interaction) => {
    let prefix = 'p!';
    const sel = interaction.values;
    const help = {
      content: "",
      embeds: [
        {
          type: "rich",
          color: 0xe08e67,
          description: "",
          footer: {
            text: "Send me new commands’ suggestions using the /contact command",
            icon_url:
              "https://cdn.discordapp.com/emojis/1142805565295308800.gif",
          },
          author: {
            name: "",
            icon_url: "",
          },
        },
      ],
    };

    if (sel[0] == "xuv") {
      prefix = (interaction.message.content.includes('/help')) ? '/xuv ' : 'p!';
      let com = interaction.message.components[0].components[0].options[0];
      help.embeds[0].author.icon_url = `https:\/\/cdn.discordapp.com/emojis/${com.emoji.id}.png`;
      help.embeds[0].author.name = com.label;
      help.embeds[0].description = [
        "* `" + prefix + "gpt <query>` - <:slash:1220953479921799218> Danky dank GPT",
        "* `" + prefix + "padhaku <query>` - <:slash:1220953479921799218> Ask study related questions.",
        "* `" + prefix + "genesis <prompt>` - <:slash:1220953479921799218> Genesis AI images",
        "* `" + prefix + "ytsum <youtube URL>` - <:slash:1220953479921799218> summarise a youtube video",
      ].join("\n");
    }
    if (sel[0] == "uti") {
      let com = interaction.message.components[0].components[0].options[1];
      help.embeds[0].author.icon_url = `https:\/\/cdn.discordapp.com/emojis/${com.emoji.id}.png`;
      help.embeds[0].author.name = com.label;
      help.embeds[0].description = [
        "* `" + prefix + "ud <word>` - get a word definition from urban dictionary",
        "* `" + prefix + "img <query>` - search images from google",
        "* `" + prefix + "lens [image]` - reverse search an image from google",
        "* `" + prefix + "screenshot <website link>` - get screenshot from a webpage",
        "* `" + prefix + "pin <create|list|delete|edit>` - Manage pins or tags in this server.",
      ].join("\n");
    }
    if (sel[0] == "img") {
      prefix = (interaction.message.content.includes('/help')) ? '/img ' : 'p!';
      let com = interaction.message.components[0].components[0].options[2];
      help.embeds[0].author.icon_url = `https:\/\/cdn.discordapp.com/emojis/${com.emoji.id}.png`;
      help.embeds[0].author.name = com.label;
      help.embeds[0].description = [
        "* `" + prefix + "rvcj [image]+[text]` - <:slash:1220953479921799218> Caption an image in RVCJ style!",
        "* `" + prefix + "lapata [image] or <mentions>` - <:slash:1220953479921799218> get Lapata.",
        "* `" + prefix + "allustuff [image]+[text]` - <:slash:1220953479921799218> Allu Arjun funnies",
        "* `" + prefix + "vosahihai [image] or <mentions>` - <:slash:1220953479921799218> Hes right you know",
        "* `" + prefix + "nearyou [image] or <mention>` - <:slash:1220953479921799218> WHO ARE YOU",
        "* `" + prefix + "goodness [image] or <mention>` - <:slash:1220953479921799218> oh my goodness gracious",
        "* `" + prefix + "animan <4 mentions>` - <:slash:1220953479921799218> put that new forgis on the jeep",
      ].join("\n");
    }
    if (sel[0] == "gam") {
      let com = interaction.message.components[0].components[0].options[3];
      help.embeds[0].author.icon_url = `https:\/\/cdn.discordapp.com/emojis/${com.emoji.id}.png`;
      help.embeds[0].author.name = com.label;
      help.embeds[0].description = [
        "* `" + prefix + "wordle` - Play the game wordle",
        "* `" + prefix + "c4` -  Play the game Connect 4",
        "* `" + prefix + "2048` - Play 2048",
        "* `" + prefix + "hangman` - Yet another word guessing game.",
      ].join("\n");
    }
    if (sel[0] == "son") {
      prefix = (interaction.message.content.includes('/help')) ? '/ ' : 'p!';
      let com = interaction.message.components[0].components[0].options[5];
      help.embeds[0].author.icon_url = `https:\/\/cdn.discordapp.com/emojis/${com.emoji.id}.png`;
      help.embeds[0].author.name = com.label;
      help.embeds[0].description = [
        "* `" + prefix + "play <search or url>` - play any song or playlist from YouTube, Spotify and SoundCloud.",
        "* `" + prefix + "pause` - pause the song.",
        "* `" + prefix + "resume` - resume the song.",
        "* `" + prefix + "stop` - stop playing and clear queue.",
        "* `" + prefix + "skip - skips the current song.",
        "* `" + prefix + "lyrics <song-name>` - get lyrics of a song nowplaying/title",
        "* `" + prefix + "queue` - shows songs in the queue.",
        "* `" + prefix + "loop` - repeats the current song.",
        "* `" + prefix + "seek <mm:ss>` - seek to a desired time in the current playing song.",
      ].join("\n");
    }
    await interaction.deferUpdate();
    return interaction.message.edit(help);
  },
};
