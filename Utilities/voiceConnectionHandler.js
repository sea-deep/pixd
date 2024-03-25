import { Client, Message } from "discord.js";
import {
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  createAudioPlayer,
} from "@discordjs/voice";
import { play, destroy } from "../Helpers/helpersMusic.js";

/**
 * @param {Client} client
 * @param {Message} message
 */
export async function startVoiceConnection(
  params,
  client,
  message,
  queueConstructor,
) {
  try {
    let connection = joinVoiceChannel({
      channelId: params.channelId,
      guildId: params.guildId,
      adapterCreator: params.adapterCreator,
    });
    const voiceChannel = message.member.voice.channel;

    queueConstructor.connection = connection;
    queueConstructor.player = createAudioPlayer();

    connection.on("stateChange", (oldState, newState) => {
      let oldNetworking = Reflect.get(oldState, "networking");
      let newNetworking = Reflect.get(newState, "networking");

      const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
        let newUdp = Reflect.get(newNetworkState, "udp");
        clearInterval(newUdp?.keepAliveInterval);
      };

      oldNetworking?.off("stateChange", networkStateChangeHandler);
      newNetworking?.on("stateChange", networkStateChangeHandler);
    });

    queueConstructor.connection = connection;
    queueConstructor.player = createAudioPlayer();
    connection.on(
      VoiceConnectionStatus.Disconnected,
      async (oldState, newState) => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5000),
          ]);
        } catch (error) {
          console.log(`Forcibly destroyed the bot.`);
          connection.destroy();
          client.queue.delete(params.guildId);
        }
      },
    );

    const userCheck = setInterval(() => {
      if (
        voiceChannel.members.size == 1 &&
        getVoiceConnection(params.guildId) != undefined
      ) {
        clearInterval(userCheck);
        destroy(message.guild, client);
        console.log(
          `No active users, bot has disconnected from "${message.guild.name}"`,
        );
      }
    }, 60 * 1000);
    try {
      play(message.guild, queueConstructor.songs[0], client, message);
    } catch (e) {
      console.log("Error while playing: ", e.message);
      let er = await message.channel.send({
        content: '',
        embeds: [
          {
            author: {
              name: '❌ An unexpected error occurred while playing the song.',
            },
            description: e.message,
            color: client.color,
          },
        ],
      });
      await client.sleep(5000);
      return deleteMessage(er);
    }
  } catch (err) {
    console.log("Unexpected error with Voice connection handler:", err.message);
    client.queue.delete(params.guildId);
    let er = await message.channel.send({
      content: '',
      embeds: [
        {
          author: {
            name: '❌ An unexpected error occurred with the Voice connection handler.',
          },
          description: err.message,
          color: client.color,
        },
      ],
    });
    await client.sleep(5000);
    return deleteMessage(er);
  }
}

async function deleteMessage(msg) {
  try {
    return msg.delete();
  } catch (e) {
    return;
  }
}
