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
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch (error) {
          console.log(`Forcibly destroyed the bot.`);
          connection.destroy();
          client.queue.delete(message.guild.id);
        }
      },
    );

    const userCheck = setInterval(() => {
      if (
        voiceChannel.members.size == 1 &&
        getVoiceConnection(message.guild.id) != undefined
      ) {
        clearInterval(userCheck);
        destroy(message.guild, client);
        console.log(
          `No active users, bot has disconnected from "${message.guild.name}"`,
        );
      }
    }, 60 * 1000);
    try {
      play(message.guild, queueConstructor.songs[0], client);
    } catch (e) {
      console.log("error while playing", e.message);
      return message.react("<:error:1090721649621479506>");
    }
  } catch (err) {
    console.log(err);
    client.queue.delete(message.guild.id);
    return message.channel.send(err);
  }
}