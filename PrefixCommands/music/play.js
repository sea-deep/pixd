#!/usr/bin/env node

import "dotenv/config";
import { Client, Message } from "discord.js";
import { startVoiceConnection } from "../../Utilities/voiceConnectionHandler.js";
import { play, parse } from "../../Helpers/helpersMusic.js";
import playDL from "play-dl";

playDL
  .getFreeClientID()
  .then((clientID) => {
    playDL.setToken({
      youtube: {
        cookie: process.env.YT_COOKIES,
      },
      soundcloud: {
        client_id: clientID,
      },
    });
  })
  .catch((err) => {
    console.error("Failed to get client ID:", err);
  });

export default {
  name: "play",
  description: "Plays from YouTube or SoundCloud.",
  aliases: ["p"],
  usage: "play <link>|<search query>",
  guildOnly: true,
  args: true,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   * @param {Client} client
   */
  execute: async (message, args, client) => {
    try {
      let serverQueue = client.queue.get(message.guild.id);
      const voiceChannel = message.member.voice.channel;
      if (!voiceChannel) {
        return message
          .react("<:error:1090721649621479506>")
