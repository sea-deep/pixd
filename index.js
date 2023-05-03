//require('dotenv').config();

const express = require('express');
const app = express();
const port = 9002;

app.get('/', (req, res) => res.send('🟢 I AM ONLINE!'));

app.listen(port, () =>
  console.log(`Your app is listening a http://localhost/${port}`)
);

const {
  Client,
  GatewayIntentBits,
  Partials,
  AttachmentBuilder,
} = require('discord.js');
const functions = require('./2048functions.js');
const {words, ALL_WORDS} = require('./words.json');
const emojis = require('./emojis.json');
const {Configuration, OpenAIApi} = require('openai');
const GIFEncoder = require('gif-encoder-2');
const Jimp = require('jimp');
const Keyv = require('keyv');
const playDL = require('play-dl');
const {
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require('@discordjs/voice');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const prefix = 'p!';
const keyv = new Keyv();
//instance of the bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    	
GatewayIntentBits.GuildMembers
  ],
  ws: {properties: {browser: 'Discord iOS'}},
  partials: [Partials.Channel],
});

const queue = new Map(); //map of guild ID and its respective queue

client.once('ready', () => {
  console.log(`${client.user.tag} is online!`);
});
client.once('reconnect', () => {
  console.log('Pixd is reconnecting...');
});
playDL.getFreeClientID().then((clientID) =>
  playDL.setToken({
    soundcloud: {
      client_id: clientID,
    },
  })
);
client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) {
      return; //don't respond to self-messages
    }
    if (!message.content.toLowerCase().startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);

    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    switch (command) {
      case '2048':
        await game2048(message);
        break;
      case 'actually':
        await actually(message);
        break;
      case 'padhaku':
        await padhaku(message);
        break;
      case 'gpt':
        await gpt(message);
        break;
      case 'p':
      case 'play':
        await execute(message, serverQueue);
        break;
      case 'next':
      case 'skip':
        await skip(message, serverQueue);
        break;
      case 'skipto':
        await skipto(message, serverQueue);
        break;
      case 'pause':
        await pause(message, serverQueue);
        break;
      case 'resume':
        await resume(message, serverQueue);
        break;
      case 'repeat':
      case 'loop':
        await loopSong(message, serverQueue);
        break;
      case 'np':
      case 'q':
      case 'queue':
        await showQueue(message, serverQueue);
        break;
      case 'clear':
        await clear(message, serverQueue);
        break;
      case 'shuffle':
        await shuffle(message, serverQueue);
        break;
      case 'seek':
        await seek(message, serverQueue);
        break;
      case 'genetics':
        await genetics(message);
        break;
      case 'stop':
      case 'kick':
      case 'remove':
        await kick(message, serverQueue);
        break;
      case 'wordle':
        await sendHelp(message);
        break;
      case 'playwordle':
        await sendGame(message);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(err.message);
  }
});

client.on('guildMemberAdd', async (member) => {
  switch (member.guild.id) {
    case '804902112700923954':
      await sendokbb(member);
      break;
    default:
      break;
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.type !== 3 && interaction.type !== 5) return;
  try {
    switch (interaction.customId) {
      case '2048_up':
        await interaction.deferUpdate();
        await moveUp(interaction.message);
        break;
      case '2048_down':
        await interaction.deferUpdate();
        await moveDown(interaction.message);
        break;
      case '2048_left':
        await interaction.deferUpdate();
        await moveLeft(interaction.message);
        break;
      case '2048_right':
        await interaction.deferUpdate();
        await moveRight(interaction.message);
        break;
      case 'guess':
        await createModal(interaction);
        break;
      case 'guessed':
        await executeModal(interaction);
        break;
      default:
        break;
    }
  } catch (err) {
    console.log(err);
  }
});

client.on('error', () => {
  client.login(process.env.BOT_TOKEN);
});

client.login(process.env.BOT_TOKEN);
async function sendokbb(member) {
  let avatarURL = member.user.displayAvatarURL({
    extension: 'png',
    forceStatic: true,
  });
  let tag = member.user.tag;
  let channel_id = '804902112700923957';
  let avatar = await Jimp.read(avatarURL);
  avatar.resize(152, 152);
  let font = await Jimp.loadFont('fcb.fnt');
  const encoder = new GIFEncoder(945, 720);
  encoder.setDelay(100);
  encoder.start();
  for (let i = 0; i < 18; i++) {
    const frame = i < 10 ? `0${i}` : `${i}`;
    const file = `./frames/frame_${frame}_delay-0.1s.gif`;

    let banner = await Jimp.read(file);
    banner.composite(avatar, 55, 31).print(
      font,
      226,
      70,
      {
        text: tag,
        alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
      },
      700
    );
    encoder.addFrame(banner.bitmap.data);
    banner.write(`output${i}.jpg`);
    console.log(file);
  }
  encoder.finish();
  const buffer = encoder.out.getData();
  let file = new AttachmentBuilder(buffer, {name: 'godnessgraciousness.gif'});
  let channel = client.guild.channels.cache.get(channel_id);
  await channel.send({
    content: `Namaste saar <@${message.member.user.id}> cummed in sarvar`,
    files: [file],
  });
}

async function moveRight(message) {
  const description = message.embeds[0].description;
  let newDescription = functions.move(description, 'right');

  let msg = functions.message({
    description: newDescription,
    score: functions.calculateScore(functions.parseDesc(newDescription)),
  });
  return message.edit(msg);
}
async function moveLeft(message) {
  const description = message.embeds[0].description;
  let newDescription = functions.move(description, 'left');

  let msg = functions.message({
    description: newDescription,
    score: functions.calculateScore(functions.parseDesc(newDescription)),
  });
  return message.edit(msg);
}
async function moveUp(message) {
  const description = message.embeds[0].description;
  let newDescription = functions.move(description, 'up');

  let msg = functions.message({
    description: newDescription,
    score: functions.calculateScore(functions.parseDesc(newDescription)),
  });
  return message.edit(msg);
}
async function padhaku(message) {
  const query = message.content.split(' ').splice(1).join(' ');
  let systemPrompt = [
    `You a super smart AI robot who can answer tough and logical questions easily.`,
    `Make responses by doing full research and maintaining accuracy.`,
  ].join(' ');
  const prompt = [
    `Context:`,
    `You are a super intelligent AI Robot.`,
    `You answer to the questions asked by the user.`,
    `You have very concise knowledge of Physics, Chemistry, Biology, and Maths`,
    `You do critical research before sending answer to the user.`,
    `You can perform large mathematical operations and complex physics questions.`,
    `You are smart enough to answer all the IIT-JEE and NEET questions.`,
    `You don't believe the user blindly if they are wrong, instead you correct them`,
    `You can answer to any academic question accurately`,
    `You are comprehensive and accurate.`,
    `You have a full range of knowledge in Science and Humanities.`,
    `You talk like a real Genius and you are smarter than a University student.`,
    `You have a very complex undersatanding of world affairs`,
    `You love helping others with their queries`,
    `You are never wrong.`,
    `You do cross check and examine in the depth of the questions before answering.`,
    `You can understand the question of the user easily even if they give little context.`,
    `You have an opinion about anythimg wrong in the society amd you are willing to share`,
    `You can draw ASCII art. You put it in code blocks:`,
    `\`\`\``,
    `ASCII art here!`,
    `\`\`\``,
    `You can write code and provide examples, for example (if the language were javascript):`,
    `\`\`\`javascript`,
    `const add = (a, b) => a + b;`,
    `add(1, 2); // returns 3`,
    `\`\`\``,
    ``,
    `Examples:`,
    `User: A wire of length 2 units is cut into two parts which are bent respectively to form a square of side = x units and a circle of radius = r units. If the sum of the areas of the square and the circle so formed is minimum, then?`,
    `You: If the sum of the areas of the square and the circle so formed is minimum, then x = 2.`,
    `User: For x∈R, f(x) = |log2 – sinx| and g(x) = f(f(x)), then?`,
    `You: g'(0) = cos(log2)`,
    `User: Which of the following is not a desirable feature of a cloning vector?`,
    `A) Presence of a marker gene`,
    `B) Presence of single restriction enzyme site`,
    `C) Presence of two or more recognition sites`,
    `D) Presence of origin of replication`,
    `You: D. Presence of two or more recognition sites,`,
    `User: When light propagates through a miaterial medium of relative permittivity and relative permeability , the velocity of light,
is given by`,
    `You: v = c/(√ϵrμr)`,
    `User: The ratio of the radius of gyration of a thin uniform disc about an axis passing through its centre and normal to its plane to the
radius of gyration of the disc about its diameter is`,
    `Assistant: The
radius of gyration of the disc about its diameter is √2:1`,
    `User: Let and be the energy of an electron in the first and second excited states of hydrogen atom, respectively. According to
the Bohr's model of an atom, the ratio is
`,
    `You: The Bohr's model of an atom, the ratio is 9:4`,
    `User: A body of mass experiences a gravitational force of , when placed at a particular point. The magnitude of the
gravitational field intensity at that point is`,
    `You: 50 N kg−1`,
    `User: What the capital of France`,
    `You: The capital of France is Paris.`,
    `User: The region between two concentric spheres of radii ‘a’ and ‘b’, respectively, has volume charge density ρ=A/r, where A is a constant and r is the distance from the centre. At the centre of the spheres is a point charge Q. The value of A such that the electric field in the region between the spheres will be constant, is:`,
    `You: Q/2πa2`,
    `User: If a curve y = f(x) passes through the point (1, –1) and satisfies the differential equation, y(1 + xy) dx = x dy, then f(-1/2) is equal to:`,
    `You: f(-1/2) is equal to 4/5`,
    `User: Why is the sky blue?`,
    `Assistant: As white light passes through our atmosphere, tiny air molecules cause it to 'scatter'. The scattering caused by these tiny air molecules (known as Rayleigh scattering) increases as the wavelength of light decreases. Violet and blue light have the shortest wavelengths and red light has the longest.`,
    ``,
    `Current Chat:`,
  ].join('\n');

  let currentChat = [`User: ${query}`, `You:`].join('\n');

  let messages = [].concat(
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: [].concat(prompt, currentChat).join('\n'),
    }
  );

  let response = '';
  await message.channel.sendTyping();
  let completion = await openai.createChatCompletion({
    model: `gpt-3.5-turbo`,
    messages: messages,
    max_tokens: 2048,
    temperature: 0.5,
    top_p: 1,
    n: 1,
    presence_penalty: 0,
    frequency_penalty: 0,
  });
  console.log(completion);
  response = completion.data.choices[0].message.content.trim();
  const ans = response.trim();
  return message.reply(ans);
}
async function moveDown(message) {
  const description = message.embeds[0].description;
  let newDescription = functions.move(description, 'down');

  let msg = functions.message({
    description: newDescription,
    score: functions.calculateScore(functions.parseDesc(newDescription)),
  });
  return message.edit(msg);
}

async function game2048(message) {
  const board = [
    `<:00:1088197427980423319> <:00:1088197427980423319> <:00:1088197427980423319> <:00:1088197427980423319>`,
    `<:00:1088197427980423319> <:00:1088197427980423319> <:00:1088197427980423319> <:00:1088197427980423319>`,
    `<:00:1088197427980423319> <:00:1088197427980423319> <:00:1088197427980423319> <:00:1088197427980423319>`,
    `<:00:1088197427980423319> <:00:1088197427980423319> <:00:1088197427980423319> <:00:1088197427980423319>`,
  ].join('\n');

  let newBoard = functions.spawnRandom(functions.parseDesc(board), 2);
  let description = functions.makeDesc(newBoard);

  let msg = functions.message({
    description: description,
    score: functions.calculateScore(newBoard),
  });
  await message.reply(msg);
}

async function gpt(message) {
  await message.channel.sendTyping();
  let username = message.author.username;
  let msg = message.content.split(' ').splice(1).join(' ');
  const prompt = [
    `PIXD is a very awesome and obedient discord bot`,
    `PIXD knows everything and responds with deep research`,
    `PIXD can code, and help users to code too!`,
    `PIXD was created by Sea-Deep#7922`,
    `PIXD believes that only 2 genders exist and all other LGBTQIA are mental disorders, And it doesn't discloses it more often`,
    ``,
    `User: ${msg}`,
    `PIXD's response: `,
  ].join('\n');

  const gptResponse = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: prompt,
    max_tokens: 512,
    temperature: 0.9,
    top_p: 1,
    presence_penalty: 0,
    frequency_penalty: 0,
  });

  return message.reply({
    content: ``,
    tts: false,
    embeds: [
      {
        type: 'rich',
        color: 0xff0000,
        description: `${gptResponse.data.choices[0].text}`,
      },
    ],
  });
}
async function genetics(message) {
  let gene =
    '<:blenderesis:977906362484916244> <:chipkalesis:975650941372084284> <:dnasis:973574876885573742> <:drawingesis:1019606581740060693> <:femalesis:973991771581333504> <:genesis:1020673182836994088> <:genebro:1020673070777761842> <:genesissfw:1070357577579376750> <:genesusu:979064159398412308> <:genussy:1020676354963935275> <:kushalesis:1019644439997722644> <:thanussy:1020678708329185340> <:thanosis:975616934982860870> <:speechesis:972860630442840116> <a:genesif:975053431091912784>';

  let genesis = gene.split(' ');

  // delete the message that triggered the event

  await message.delete();
  let isLink = false;
  let channelID = message.channelId;
  let referencedMessageId = null;
  if (message.reference) {
    referencedMessageId = message.reference.messageId;
  } else if (message.content.split(' ').length !== 1) {
    isLink = true;
    let msgLink = message.content.split(' ').splice(1).join(' ');

    const regex = /\/(\d+)\/(\d+)$/;

    const match = msgLink.match(regex);

    channelID = match[1];

    referencedMessageId = match[2];
  } else {
    let msg = await message.channel.messages.fetch({limit: 1});

    referencedMessageId = msg.first().id;
  }

  for (let i = 0; i < genesis.length; i++) {
    if (isLink) {
      let channel = client.channels.cache.get(channelID);

      channel.messages
        .fetch(referencedMessageId)
        .then((msg) => msg.react(genesis[i]));
    } else {
      await message.channel.messages
        .fetch(referencedMessageId)
        .then((msg) => msg.react(genesis[i]));
    }
  }
}
async function actually(message) {
  let gene =
    '<:actually:1085483052962173009> <:inerd:1085486860417110026> <:nerd:1085483964917096520> <:nerdbob:1085483238149070878> <:nerdd:1085486459244527657> <:nerdddd:1085486629902364703> <:nerddddd:1085486964096127028> <:nerdddddd:1085487061986988092> <:nerdy:1085487343663845397> <:nerdyy:1085488754229252237> <:nerdyyy:1085488822650945596> <:nerdyyyy:1085488900065214464> <:nerdyyyyy:1085488991870144512> <:nerdyyyyyy:1085489036749176996> <:nerdyz:1085489094198579200> <:padhaku:1085487174994112532> <:quote:1085483838840516629> <a:nerddd:1085483561404092476> <a:umactually:1085483295069966365> <:chodu:1085490222290190357>';

  let genesis = gene.split(' ');

  // delete the message that triggered the event

  await message.delete();

  let isLink = false;

  let channelID = message.channelId;

  let referencedMessageId = null;

  if (message.reference) {
    referencedMessageId = message.reference.messageId;
  } else if (message.content.split(' ').length !== 1) {
    isLink = true;

    let msgLink = message.content.split(' ').splice(1).join(' ');

    const regex = /\/(\d+)\/(\d+)$/;

    const match = msgLink.match(regex);

    channelID = match[1];

    referencedMessageId = match[2];
  } else {
    let msg = await message.channel.messages.fetch({limit: 1});

    referencedMessageId = msg.first().id;
  }

  for (let i = 0; i < genesis.length; i++) {
    if (isLink) {
      let channel = client.channels.cache.get(channelID);

      channel.messages
        .fetch(referencedMessageId)
        .then((msg) => msg.react(genesis[i]));
    } else {
      await message.channel.messages
        .fetch(referencedMessageId)
        .then((msg) => msg.react(genesis[i]));
    }
  }
}
async function execute(message, serverQueue) {
  const args = message.content.split(' ');
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    return message.react('<:error:1090721649621479506>');
  }
  if (args.length == 1) {
    return message.react('<:error:1090721649621479506>');
  }
  let song = {};
  let songs = []; //array of song objects
  let check = await playDL.validate(args[1].trim());
  if (check === false) {
    return message.react('<:error:1090721649621479506>');
  } else if (check === 'search') {
    let searchSource = {youtube: 'video'};
    let query = message.content
      .substring(message.content.indexOf(' '), message.content.length)
      .trim();
    if (args[1].trim() == '-sc' || args[1].trim() == '-soundcloud') {
      searchSource = {soundcloud: 'tracks'};
      query = message.content
        .substring(
          message.content.indexOf(' ', message.content.indexOf(' ') + 1),
          message.content.length
        )
        .trim();
      console.log(
        `${message.author.username} searched for '${query}' on SoundCloud🔎`
      );
    } else {
      console.log(
        `${message.author.username} searched for '${query}' on YouTube🔎`
      );
    }

    const searchMsg = await message.react('<:search:1090725319884951623>');
    const search = await playDL.search(query, {
      limit: 1,
      source: searchSource,
    });
    await message.reactions.cache
      .get('1090725319884951623')
      .remove()
      .catch((error) => console.error('Failed to remove reactions:', error));

    if (search.length == 0) {
      return message.react('<:error:1090721649621479506>');
    } else {
      song = {
        title: search[0].title,
        url: search[0].url,
        duration: search[0].durationInSec,
        durationTime: parse(search[0].durationInSec),
        //seek: timeToSeek,
        //seekTime: parse(timeToSeek),
        source: 'yt',
      };
      if ('soundcloud' in searchSource) {
        song.title = search[0].name;
        song.source = 'so';
      }
      songs.push(song);
    }
  } else {
    let source = check.split('_')[0];
    let type = check.split('_')[1];
    //console.log(type);  //debug
    if (source === 'yt') {
      if (type === 'video') {
        const video = await playDL.video_info(args[1]);
        song = {
          title: video.video_details.title,
          url: video.video_details.url,
          duration: video.video_details.durationInSec,
          durationTime: parse(video.video_details.durationInSec),
          //seek: timeToSeek,
          //seekTime: parse(timeToSeek),
          source: 'yt',
        };
        songs.push(song);
      } else if (type === 'playlist') {
        const playlist = await playDL.playlist_info(args[1], {
          incomplete: true,
        }); //parse youtube playlist ignoring hidden videos
        const videos = await playlist.all_videos();
        console.log(
          `Fetched ${playlist.total_videos} videos from "${playlist.title}"`
        );
        videos.forEach(function (video) {
          song = {
            title: video.title,
            url: video.url,
            duration: video.durationInSec,
            durationTime: parse(video.durationInSec),
            //seek: timeToSeek,
            //seekTime: parse(timeToSeek),
            source: 'yt',
          };
          songs.push(song);
        });
        message.channel.send({
          content: '**Added to queue**',
          tts: false,
          embeds: [
            {
              type: 'rich',
              title: '',
              description: '',
              color: 0x462,
              author: {
                name: `Added ${songs.length} songs to the queue`,
                icon_url: `https://media.discordapp.net/attachments/1011986872500764672/1090737187869438033/icons8-cd.gif`,
              },
            },
          ],
        });
      }
    } else if (source === 'so') {
      const so = await playDL.soundcloud(args[1]);
      if (type === 'track') {
        song = {
          title: so.name,
          url: so.url,
          duration: so.durationInSec,
          durationTime: parse(so.durationInSec),
          source: 'so',
        };
        songs.push(song);
      } else if (type === 'playlist') {
        const tracks = await so.all_tracks();
        console.log(`Fetched ${so.total_tracks} tracks from "${so.name}"`);
        tracks.forEach(function (track) {
          song = {
            title: track.name,
            url: track.url,
            duration: track.durationInSec,
            durationTime: parse(track.durationInSec),
            source: 'so',
          };
          songs.push(song);
        });
        message.message.channel.send({
          content: '**Added to queue**',
          tts: false,
          embeds: [
            {
              type: 'rich',
              title: '',
              description: '',
              color: 0x462,
              author: {
                name: `Added ${songs.length} songs to the queue`,
                icon_url: `https://media.discordapp.net/attachments/1011986872500764672/1090737187869438033/icons8-cd.gif`,
              },
            },
          ],
        });
      }
    } else if (source === 'sp') {
      return message.react('<:error:1090721649621479506>');
    }
  }
  if (!serverQueue) {
    const queueConstructor = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: songs,
      player: null,
      loop: false,
      //loopall: false,
      //seek: timeToSeek,
      keep: false, //whether or not the current song should be kept in the queue, used for skipping songs while looping
      timeoutID: undefined, //separate timeout ID for each guild
      //volume: 5,
      //playing: true
    };

    queue.set(message.guild.id, queueConstructor);
    //queueConstructor.songs.push(song);

    //attempt a connection with the user's voice channel, create the audio player and begin playing the first song
    try {
      let connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
      });
      queueConstructor.connection = connection;
      queueConstructor.player = createAudioPlayer();
      connection.on('stateChange', (oldState, newState) => {
        let oldNetworking = Reflect.get(oldState, 'networking');

        let newNetworking = Reflect.get(newState, 'networking');

        const networkStateChangeHandler = (
          oldNetworkState,
          newNetworkState
        ) => {
          let newUdp = Reflect.get(newNetworkState, 'udp');

          clearInterval(newUdp?.keepAliveInterval);
        };

        oldNetworking?.off('stateChange', networkStateChangeHandler);

        newNetworking?.on('stateChange', networkStateChangeHandler);
      });

      queueConstructor.connection = connection;

      queueConstructor.player = createAudioPlayer();

      connection.on(
        VoiceConnectionStatus.Disconnected,
        async (oldState, newState) => {
          try {
            await Promise.race([
              entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
              entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]);
            // Seems to be reconnecting to a new channel - ignore disconnect
          } catch (error) {
            // Seems to be a real disconnect which SHOULDN'T be recovered from
            console.log(`Forcibly destroyed the bot.`);
            connection.destroy();
            queue.delete(message.guild.id);
          }
        }
      );

      const userCheck = setInterval(() => {
        //console.log(voiceChannel.members.size);
        if (
          voiceChannel.members.size == 1 &&
          getVoiceConnection(message.guild.id) != undefined
        ) {
          clearInterval(userCheck);
          destroy(message.guild);
          console.log(
            `No active users, bot has disconnected from "${message.guild.name}"`
          );
        }
      }, 60 * 1000);
      //*BUG* userCheck interval still emits after timeout and after kick

      play(message.guild, queueConstructor.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id); //on error, trash the serverqueue
      return message.channel.send(err);
    }
  } else {
    //console.log(serverQueue.songs.length);
    if (serverQueue.songs.length == 0) {
      //check if queue is empty prior to adding songs
      serverQueue.songs = serverQueue.songs.concat(songs); //append the new songs to the end of the queue
      play(message.guild, serverQueue.songs[0]);
    } else {
      serverQueue.songs = serverQueue.songs.concat(songs); //append the new songs to the end of the queue
      if (songs.length > 1) {
        //return message.channel.send(`Added \*\*${songs.length}\*\* songs to the queue.`);
      } else {
        if (song.seek > 0) {
          console.log(
            `Added ${song.title} {${song.durationTime.minutes}:${song.durationTime.seconds}} to the queue starting at ${song.seekTime.minutes}:${song.seekTime.seconds}`
          );
          return message.react('<:seek:1090718780545581116>');
        } else {
          console.log(
            `Added ${song.title} to the queue. {${song.durationTime.minutes}:${song.durationTime.seconds}}`
          );
          return message.channel.send({
            content: '**Added to queue**',
            tts: false,
            embeds: [
              {
                type: 'rich',
                title: '',
                description: '',
                color: 0x462,
                author: {
                  name: `${song.title} - ${song.durationTime.minutes}:${song.durationTime.seconds}`,
                  icon_url: `https://media.discordapp.net/attachments/1011986872500764672/1090737187869438033/icons8-cd.gif`,
                },
              },
            ],
          });
        }
      }
      //showQueue(serverQueue);
    }
  }
  //setTimeout(() => {message.delete(), 30*1000}); //delete user message after 30 seconds
}
function destroy(guild) {
  getVoiceConnection(guild.id).destroy();
  queue.delete(guild.id);
}
async function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  // if (guild.id in queue){
  //     queue.delete(guild.id);
  // }

  if (!song) {
    serverQueue.timeoutID = setTimeout(() => {
      //separate timeout for each server
      //clearInterval(userCheck);
      if (getVoiceConnection(guild.id) != undefined) {
        //console.log(getVoiceConnection(guild.id));
        console.log(`Timeout for "${guild.name}"`);
        destroy(guild);
        serverQueue.timeoutID = undefined; //after timeout goes off, reset timeout value.
      } else {
        console.log('Bot was disconnected during the timeout.');
      }
    }, 10 * 60 * 1000); //10 min idle
    console.log(`Timeout set for "${guild.name}"`);
    if (serverQueue.loop == true) {
      serverQueue.loop = false; //if there is no song to be played, disable the loop, no point looping an empty queue
      console.log('Disabled the loop.');
    }
    return;
  }

  //if song is queued during timeout, clear timeout
  if (serverQueue.timeoutID != undefined) {
    console.log(`Timeout cleared for "${guild.name}"`);
    clearTimeout(serverQueue.timeoutID);
    serverQueue.timeoutID = undefined;
  }

  let stream;
  //console.log(song.source);

  if (song.source === 'yt' && song.seek > 0) {
    //only yt songs can be seeked, but there are songs from various sources in the playlist
    console.log(`Seeked ${song.seek} seconds into the song.`);
    stream = await playDL.stream(song.url, {seek: song.seek});
  } else {
    //console.trace();
    stream = await playDL.stream(song.url);
  }

  let resource = createAudioResource(stream.stream, {
    inputType: stream.type,
  });

  serverQueue.connection.subscribe(serverQueue.player);

  serverQueue.player.play(resource);

  //event handlers for the music player
  var errorListener = (error) => {
    console.error(
      `Error: ${error.message} with resource ${error.resource.title}`
    );
    //serverQueue.textChannel.send(`${error.message} error with resource ${error.resource.title}. Please try again.`)
  };

  serverQueue.player.on('error', errorListener);

  serverQueue.player.once(AudioPlayerStatus.Idle, () => {
    serverQueue.player.removeListener('error', errorListener); //remove previous listener
    if (serverQueue.loop && serverQueue.keep) {
      //the loop is on and the song is flagged to be kept
      serverQueue.songs.push(serverQueue.songs.shift());
    } else {
      //pop song off the array (essentially placing the next song at the top)
      serverQueue.songs.shift();
      if (serverQueue.loop === true) {
        serverQueue.keep = true; //reset keep flag after skipping in a loop
      }
    }
    play(guild, serverQueue.songs[0]);
  });

  console.log(
    `Playing ${song.title} {${song.durationTime.minutes}:${song.durationTime.seconds}} in "${guild.name}"`
  ); //starting at {${song.seekTime.minutes}:${song.seekTime.seconds}}`);
  if (serverQueue.loop == true) {
    // don't print anything
  } else {
    if (song.seek > 0) {
      //um ok
    } else {
      serverQueue.textChannel.send({
        content: '**Now Playing**',
        tts: false,
        embeds: [
          {
            type: 'rich',
            title: '',
            description: '',
            color: 0x462,
            author: {
              name: `${song.title} - ${song.durationTime.minutes}:${song.durationTime.seconds}`,
              icon_url: `https://media.discordapp.net/attachments/1011986872500764672/1090737187869438033/icons8-cd.gif`,
            },
          },
        ],
      });
      //.then(msg => setTimeout(() => msg.delete(), song.duration*1000));
    }
    //showQueue(serverQueue);
  }
}
function clear(message, serverQueue) {
  if (!message.member.voice.channel) {
    return message.react('<:error:1090721649621479506>');
  }
  if (!serverQueue || serverQueue.songs.length == 0) {
    return message.react('<:error:1090721649621479506>');
  }

  let currentSong = serverQueue.songs[0];
  serverQueue.songs = [currentSong]; //remove all songs except for currently playing song
  serverQueue.loop = false;
  serverQueue.keep = false;
  //serverQueue.songs = [];     //empty the queue
  //serverQueue.player.stop();  //then skip current song by invoking AudioPlayer stop method

  console.log(`Cleared queue.`);
  return message.react('<:clear:1090718705060684008>');
}

function loopSong(message, serverQueue) {
  const args = message.content.split(' ');

  if (!message.member.voice.channel) {
    return message.react('<:error:1090721649621479506>');
  }
  if (!serverQueue || serverQueue.songs.length == 0) {
    return message.react('<:error:1090721649621479506>');
  }
  serverQueue.loop = !serverQueue.loop; //loop the queue
  serverQueue.keep = !serverQueue.keep; //and keep the current song
  if (serverQueue.loop) {
    console.log(`Looping the queue.`);
    return message.react('<:loop:1090721294779162756>');
  } else {
    console.log('Disabled the loop.');
    return message.react('<:unloop:1090721386848333934>');
  }
}

function showQueue(message, serverQueue) {
  const args = message.content.split(' ');
  let pos = 999;

  if (!message.member.voice.channel) {
    return message.react('<:error:1090721649621479506>');
  }
  if (!serverQueue || serverQueue.songs.length == 0) {
    return message.channel.send({
      content: 'Queue',
      tts: false,
      embeds: [
        {
          type: 'rich',
          title: '',
          description:
            '```' +
            `No song currently playing\n----------------------------\n` +
            '```',
          color: 0x462,
        },
      ],
    }); //.then(msg => setTimeout(() => msg.delete(), 15*1000));
  }

  if (args.length == 2) {
    pos = parseInt(args[1]);
    if (pos < 0 || isNaN(pos)) {
      return;
    } else {
      pos = args[1];
    }
  }
  let nowPlaying = serverQueue.songs[0];
  let msg = `Now playing: ${nowPlaying.title}\n----------------------------\n`;
  let msg1 = ``;
  let length = Math.min(serverQueue.songs.length, ++pos); //queue includes current playing song, so we want to show current playing + the number of songs to be shown
  //let duration = nowPlaying.duration;
  for (var i = 1; i < length; i++) {
    if (serverQueue.songs[i].seek > 0) {
      text = `${i}. ${serverQueue.songs[i].title} starting at ${serverQueue.songs[i].seekTime.minutes}:${serverQueue.songs[i].seekTime.seconds}\n`;
      //duration = nowPlaying.duration - nowPlaying.seek;
    } else {
      text = `${i}. ${serverQueue.songs[i].title}\n`;
    }

    //text can fit in msg even if out of order (Fix) also need to extend this or add pages consider array of messages
    if (text.length + msg.length < 2000) {
      msg += text;
    } else {
      msg1 += text;
    }
  }
  message.channel
    .send({
      content: '**Queue**',
      tts: false,
      embeds: [
        {
          type: 'rich',
          title: '',
          description: `\`\`\`\n${msg}\`\`\``,
          color: 0x462,
        },
      ],
    })
    .then((msg) => setTimeout(() => msg.delete(), 60 * 1000));
  if (msg1 != ``) {
    message.channel
      .send('```' + msg1 + '```')
      .then((msg) => setTimeout(() => msg.delete(), 60 * 1000));
  }
}

function pause(message, serverQueue) {
  if (!message.member.voice.channel) {
    return message.react('<:error:1090721649621479506>');
  }
  if (!serverQueue || serverQueue.songs.length == 0) {
    return message.react('<:error:1090721649621479506>');
  }
  console.log(`Song paused.`);
  serverQueue.player.pause();
  return message.react('<:pause:1090718191824683038>');
}

function resume(message, serverQueue) {
  if (!message.member.voice.channel) {
    return message.react('<:error:1090721649621479506>');
  }
  if (!serverQueue || serverQueue.songs.length == 0) {
    return message.react('<:error:1090721649621479506>');
  }
  console.log(`Song resumed.`);
  serverQueue.player.unpause();
  return message.react('<:resume:1090718421425070090>');
}

function kick(message, serverQueue) {
  if (!message.member.voice.channel) {
    return message.react('<:error:1090721649621479506>');
  }
  if (!serverQueue) {
    return message.react('<:error:1090721649621479506>');
  }
  console.log(`Kicked the bot.`);
  message.react('<:stop:1090718630628573245>');
  serverQueue.connection.destroy();
  queue.delete(message.guild.id);
}

function shuffle(message, serverQueue) {
  if (!message.member.voice.channel) {
    return message.react('<:error:1090721649621479506>');
  }
  if (!serverQueue || serverQueue.songs.length == 0) {
    return message.react('<:error:1090721649621479506>');
  }

  for (let i = serverQueue.songs.length - 1; i > 1; --i) {
    //Fisher-Yates shuffle algorithm but exclude current playing song
    const j = 1 + Math.floor(Math.random() * i);
    [serverQueue.songs[i], serverQueue.songs[j]] = [
      serverQueue.songs[j],
      serverQueue.songs[i],
    ];
  }
  console.log('Shuffled the queue.');
  message.react('<:shuffle:1090732407931543681>');
}

function seek(message, serverQueue) {
  const args = message.content.split(' ');
  if (!message.member.voice.channel) {
    return message.react('<:error:1090721649621479506>');
  }
  if (!serverQueue || serverQueue.songs.length == 0) {
    return message.react('<:error:1090721649621479506>');
  }
  if (serverQueue.songs[0].source != 'yt') {
    return message.react('<:error:1090721649621479506>');
  }
  let timeToSeek = parse(args[1]);
  let seekTime = parse(timeToSeek);
  //console.log(timeToSeek);
  //console.log(seekTime);
  let maxDuration = serverQueue.songs[0].duration;
  let maxTime = parse(maxDuration);
  if (timeToSeek > maxDuration || timeToSeek < 0) {
    //console.log(maxDuration)
    console.log(`Seek failed, requested ${timeToSeek}, max is ${maxDuration}`);
    return message.react('<:error:1090721649621479506>');
  }
  //else if (timeToSeek == 0) {
  //     return message.react('<:error:1090721649621479506>');
  //}
  let currentSong = serverQueue.songs[0];
  currentSong.seek = timeToSeek;
  currentSong.seekTime = seekTime;
  serverQueue.songs.unshift(currentSong);
  serverQueue.player.stop();
  return message.react('<:seek:1090718780545581116>');
}

//used to remove a song
function skip(message, serverQueue) {
  const args = message.content.split(' ');

  if (!message.member.voice.channel) {
    return message.react('<:error:1090721649621479506>');
  }
  if (!serverQueue || serverQueue.songs.length == 0) {
    return message.react('<:error:1090721649621479506>');
  }
  if (args.length == 1) {
    serverQueue.player.stop(); //AudioPlayer stop method to skip to next song
    console.log(`Skipped ${serverQueue.songs[0].title}.`);
    return message.react('<:skip:1090718541143097464>');
    //.then(msg => setTimeout(() => msg.delete(), 30 * 1000)); //delete after 30 seconds
  }
  let pos = parseInt(args[1]); //check if position is an integer
  if (isNaN(pos)) {
    //skip by keyword
    let query = message.content
      .substring(message.content.indexOf(' '), message.content.length)
      .trim();
    if (args[1] == 'last' || args[1] == 'end') {
      //check certain keywords first
      pos = serverQueue.songs.length - 1;
    } else {
      //otherwise find a match
      const regex = new RegExp(query, 'i'); //case insensitive regex
      pos = serverQueue.songs.findIndex(function (s) {
        //find position of a song title including keyword
        return regex.test(s.title);
      });
    }
    if (pos < 0) {
      return message.react('<:error:1090721649621479506>');
    }
  } else if (pos > serverQueue.songs.length - 1 || pos < 0) {
    return message.react('<:error:1090721649621479506>'); //return statement to avoid skipping
  }
  if (pos == 0) {
    //removing the current playing song results in a skip
    serverQueue.player.stop();
    console.log(`Skipped ${serverQueue.songs[0].title}.`);
    return message.react('<:skip:1090718541143097464>');
  }
  console.log(`Removed ${serverQueue.songs[pos].title} from the queue.`);
  message.react('<:skip:1090718541143097464>');
  //.then(msg => setTimeout(() => msg.delete(), 30*1000));
  serverQueue.songs.splice(pos, 1);

  serverQueue.keep = false; //don't keep skipped song in the queue
}

//used to skip to a song
function skipto(message, serverQueue) {
  const args = message.content.split(' ');
  let pos = parseInt(args[1]);
  let song;
  if (!message.member.voice.channel) {
    return message.react('<:error:1090721649621479506>');
  }
  if (!serverQueue || serverQueue.songs.length == 0) {
    return message.react('<:error:1090721649621479506>');
  }
  if (isNaN(pos)) {
    //skip by keyword
    let query = message.content
      .substring(message.content.indexOf(' '), message.content.length)
      .trim();
    if (args[1] == 'last' || args[1] == 'end') {
      //check certain keywords first
      pos = serverQueue.songs.length - 1;
    } else {
      //otherwise find a match
      const regex = new RegExp(query, 'i'); //case insensitive regex
      pos = serverQueue.songs.findIndex(function (s) {
        //find position of a song title matching keyword
        return regex.test(s.title);
      });
    }
    if (pos < 0) {
      return message.react('<:error:1090721649621479506>');
    }
  } else if (pos < 0 || pos > serverQueue.songs.length - 1) {
    return message.react('<:error:1090721649621479506>');
  }
  if (pos == 0) {
    return message.react('<:error:1090721649621479506>');
  }
  song = serverQueue.songs.splice(pos, 1); //remove the song (splice returns array)
  serverQueue.songs.splice(1, 0, song[0]); //make it the next song
  serverQueue.player.stop(); //skip current playing song
}

/**
 * Given a number, parses it into the form of mm:ss
 * @param {number} input number to parse.
 * @returns {object} object containing the parsed data.
 */
function parse(input) {
  //console.log(input);
  if (typeof input == 'string' && input.indexOf(':') != -1) {
    //input in form of mm:ss
    let time = input.split(':');
    if (isNaN(time[0]) || isNaN(time[1]) || time[0] < 0 || time[1] < 0) {
      //
    } else {
      //otherwise, parse the given time
      let minutes = Number(time[0] * 60);
      let seconds = Number(time[1]);
      timeToSeek = minutes + seconds;
      return timeToSeek;
      //console.log(timeToSeek);
    }
  } else if (typeof input == 'number') {
    let minutes = Math.floor(input / 60);
    let seconds = input % 60 < 10 ? '0' + (input % 60) : input % 60;
    //return [minutes, seconds];
    return {minutes: minutes, seconds: seconds};
  } else {
    return 0;
  }
}
async function sendGame(message) {
  let msg = await message.reply({
    content: `<@${message.author.id}>'s game`,
    tts: false,
    components: [
      {
        type: 1,
        components: [
          {
            style: 1,
            label: `GUESS`,
            custom_id: `guess`,
            disabled: false,
            emoji: {
              id: null,
              name: `🧐`,
            },
            type: 2,
          },
        ],
      },
    ],
    embeds: [
      {
        type: 'rich',
        title: `WORDLE`,
        description: [
          `◻️ ◻️ ◻️ ◻️ ◻️`,
          `◻️ ◻️ ◻️ ◻️ ◻️`,
          `◻️ ◻️ ◻️ ◻️ ◻️`,
          `◻️ ◻️ ◻️ ◻️ ◻️`,
          `◻️ ◻️ ◻️ ◻️ ◻️`,
          `◻️ ◻️ ◻️ ◻️ ◻️`,
        ].join('\n'),
        color: 0xff0000,
        fields: [
          {
            name: `🎚️ Chances Left :`,
            value: `6`,
          },
        ],
        footer: {
          text: `Use ${prefix}help for rules and context about the game`,
        },
      },
    ],
  });

  let key = msg.id;
  let val = words[Math.floor(Math.random() * words.length)];
  await keyv.set(key, val, 75000000);
}
async function sendHelp(message) {
  const desc = [
    `• After each guess, the color of the tiles will change to show how close your guess was to the word.\n`,
    `**Tile color meanings:**\n`,
    `${emojis.green.w} ${emojis.gray.e} ${emojis.gray.a} ${emojis.gray.r} ${emojis.gray.y}`,
    `The letter **W** is present in this word and is in the correct spot.\n`,
    `${emojis.gray.p} ${emojis.gray.i} ${emojis.yellow.v} ${emojis.gray.o} ${emojis.gray.t}`,
    `The letter **V** is in the word but in wrong spot.\n`,
    `${emojis.green.v} ${emojis.green.a} ${emojis.gray.l} ${emojis.green.u} ${emojis.green.e}`,
    `The letter **L** is not in the word in any spot`,
  ].join(`\n`);
  await message.channel.send({
    content: `**HOW TO PLAY**`,
    tts: false,
    embeds: [
      {
        type: 'rich',
        title: `Guess the WORDLE in 6 tries.`,
        description: desc,
        color: 0xa9f,
        footer: {
          text: `Play now ${prefix}playwordle`,
        },
      },
    ],
  });
}

async function createModal(interaction) {
  if (interaction.message.content.includes(interaction.user.id)) {
    await interaction.showModal({
      custom_id: `guessed`,
      title: `Enter your guess`,
      components: [
        {
          type: 1, // Component row
          components: [
            {
              type: 4, // Text input component, only valid in modals
              custom_id: 'answer',
              label: `Enter a valid word:`,
              style: 1, // 1 for line, 2 for paragraph
              min_length: 5,
              max_length: 5,
              placeholder: 'adieu',
              required: true,
            },
          ],
        },
      ],
    });
  } else {
    await interaction.reply({
      content: 'This is not your game.',
      ephemeral: true,
    });
  }
}
async function executeModal(interaction) {
  const value = interaction.fields.getTextInputValue('answer').toLowerCase();
  if (ALL_WORDS.includes(value.toLowerCase())) {
    //if the word is valid.
    const answer = await keyv.get(interaction.message.id);
    const wordArr = getColoredWord(answer, value); //Calling getColoredWord function to get the coloured alphabet emote's array
    const colouredWord = wordArr.join(' '); //Joining it
    const oldChances = parseInt(interaction.message.embeds[0].fields[0].value); //Chances before the modal was submitted
    const newChances = oldChances - 1; //Decrementing a turn to continue game.
    let descArr = interaction.message.embeds[0].description
      .split('\n')
      .reverse(); //Splitting the description from new lines, then reversing it.
    descArr[newChances] = colouredWord; //Replacing the next '◻️ ◻️ ◻️ ◻️ ◻️' with the coloured word, which was entered by the player
    let newDesc = descArr.reverse().join('\n'); //getting the new description up by reversing and joining with new lines.

    const count = descArr.reduce(
      (count, el) => (!el.includes('◻️') ? count + 1 : count),
      0
    ); //Turns taken by the player reaching the correct word.
    let msg = {
      content: `<@${interaction.user.id}>'s game`,
      tts: false,
      components: [
        {
          type: 1,
          components: [
            {
              style: 1,
              label: `GUESS`,
              custom_id: `guess`,
              disabled: true,
              emoji: {
                id: null,
                name: `🧐`,
              },
              type: 2,
            },
          ],
        },
      ],
      embeds: [
        {
          type: 'rich',
          title: `WORDLE`,
          description: `${newDesc}`,
          color: 0xff0000,
          fields: [
            {
              name: `🏆 YOU WON`,
              value: `Your performance: \`${count}/6\``,
            },
          ],
          footer: {
            text: `Use ${prefix}wordle for rules and context about the game`,
          },
        },
      ],
    }; // The message when the player wins, it is updated below depending on the game status
    if (!wordArr.some((element) => !element.includes('green'))) {
      // If the player wins
      await keyv.delete(interaction.message.id);
    } else if (oldChances == 1) {
      // Updating the msg object for when the user loses
      msg.embeds[0].fields[0].name = '🦆 You Lost';
      msg.embeds[0].fields[0].value = `The word was ${answer}`;
      await keyv.delete(interaction.message.id);
    } else {
      // If the game is not over
      msg.components[0].components[0].disabled = false;
      msg.embeds[0].fields[0].name = '🎚️ Chances Left :';
      msg.embeds[0].fields[0].value = newChances;
    }
    await interaction.deferUpdate(); //Deferring the interaction as we are not responding to it.
    await interaction.message.edit(msg); //Editing the game message
  } else {
    await interaction.reply({
      content: 'Please enter a valid word.',
      ephemeral: true,
    });
  }
}
function getColoredWord(answer, guess) {
  let coloredWord = [];
  for (let i = 0; i < guess.length; i++) {
    coloredWord.push(emojis.gray[guess[i]]);
  }
  let guessLetters = guess.split('');
  let answerLetters = answer.split('');

  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] === answerLetters[i]) {
      coloredWord[i] = emojis.green[guessLetters[i]];
      answerLetters[i] = null;
      guessLetters[i] = null;
    }
  }

  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] && answerLetters.includes(guessLetters[i])) {
      coloredWord[i] = emojis.yellow[guessLetters[i]];
      answerLetters[answerLetters.indexOf(guessLetters[i])] = null;
    }
  }
  return coloredWord;
}
