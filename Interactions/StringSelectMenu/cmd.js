export default {
  name: "cmd",
  execute: async (interaction, client) => {
    let prefix = 'p!';
    const sel = interaction.values;
    const help = {
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
        "* `" + prefix + "gpt <query>` - Danky dank GPT",
     //   "* `" + prefix + "padhaku <query>` - Ask study related questions.",
   //     "* `" + prefix + "genesis <prompt>` - Genesis AI images",
        "* `" + prefix + "ytsum <youtube URL>` - summarise a youtube video",
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
        "* `" + prefix + "pin <create|list|delete|edit>` - Manage pins or tags in this server.",
        "* `" + prefix + "piracy <query> <type> <sort>` - Search and download anything you want! Videos, audios, ebooks, etc.",   
      ].join("\n");
    }
    if (sel[0] == "img") {
      prefix = (interaction.message.content.includes('/help')) ? '/img ' : 'p!';
      let com = interaction.message.components[0].components[0].options[3];
      help.embeds[0].author.icon_url = `https:\/\/cdn.discordapp.com/emojis/${com.emoji.id}.png`;
      help.embeds[0].author.name = com.label;
      help.embeds[0].description = [
        "* `" + prefix + "rvcj [image]+[text]` - Caption an image in RVCJ style!",
        "* `" + prefix + "lapata [image] or <mentions>` - get Lapata.",
        "* `" + prefix + "allustuff [image]+[text]` - Allu Arjun funnies",
        "* `" + prefix + "vosahihai [image] or <mentions>` - Hes right you know",
        "* `" + prefix + "nearyou [image] or <mention>` - WHO ARE YOU",
        "* `" + prefix + "goodness [image] or <mention>` - oh my goodness gracious",
        "* `" + prefix + "animan <4 mentions>` - put that new forgis on the jeep",
      ].join("\n");
    }
    if (sel[0] == "gam") {
      let com = interaction.message.components[0].components[0].options[4];
      help.embeds[0].author.icon_url = `https:\/\/cdn.discordapp.com/emojis/${com.emoji.id}.png`;
      help.embeds[0].author.name = com.label;
      help.embeds[0].description = [
        "* `" + prefix + "wordle` - Play the game wordle",
        "* `" + prefix + "chess <@user>` - Play chess on discord with me or someone else",
        "* `" + prefix + "c4` -  Play the game Connect 4",
        "* `" + prefix + "2048` - Play 2048",
        "* `" + prefix + "wordchain` - Start a chain of words in the chat",
        "* `" + prefix + "hangman` - Yet another word guessing game.",
      ].join("\n");
    }
    if (sel[0] == "son") {
      prefix = (interaction.message.content.includes('/help')) ? '/' : 'p!';
      let com = interaction.message.components[0].components[0].options[2];
      help.embeds[0].author.icon_url = `https:\/\/cdn.discordapp.com/emojis/${com.emoji.id}.png`;
      help.embeds[0].author.name = com.label;
      help.embeds[0].description = [
        "* `" + prefix + "play <search or url>` - play any song or playlist from YouTube, Spotify and SoundCloud.",
        "* `" + prefix + "pause` - pause the song.",
        "* `" + prefix + "resume` - resume the song.",
        "* `" + prefix + "stop` - stop playing and clear queue.",
        "* `" + prefix + "skip` - skips the current song.",
        "* `" + prefix + "lyrics <song-name>` - get lyrics of a song nowplaying/title",
        "* `" + prefix + "queue` - shows songs in the queue.",
        "* `" + prefix + "loop` - repeats the current song.",
        "* `" + prefix + "seek <mm:ss>` - seek to a desired time in the current playing song.",
      ].join("\n");
    }
    await client.interactionDefer(interaction);
    return interaction.message.edit(help);
  },
};
