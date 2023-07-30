import { AttachmentBuilder, Message } from "discord.js";
import GIFEncoder from 'gif-encoder-2';
import path from 'path';
import Jimp from 'jimp';
export default {
  event: "guildMemberAdd",
  /**
    * @param {Client} client
    * @param {GuildMember} member
    */
  execute: async (member, client) => {
    switch (member.guild.id) { 
       case '804902112700923954': 
         await sendOkbb(member, client); 
         break; 
       case '1062998378293776384': 
         await sendPajeet(member, client); 
         break; 
       default: 
         break;
    }
    async function sendOkbb(member, client) { 
   let avatarURL = member.user.displayAvatarURL({ 
     extension: 'png', 
     forceStatic: true, 
   }); 
   let tag = member.user.tag; 
   let channel_id = '1128609011852390400'; 
   let avatar = await Jimp.read(avatarURL); 
   avatar.resize(100, 100); 
   let font = await Jimp.loadFont(path.resolve('./Assets/fcb.fnt')); 
   const encoder = new GIFEncoder(630, 430); 
   encoder.setDelay(100); 
   encoder.start(); 
   for (let i = 0; i < 18; i++) { 
     const frame = i < 10 ? `0${i}` : `${i}`; 
     const file = path.resolve(`./Assets/okbbFrames/frame_${frame}_delay-0.1s.gif`); 
     let banner = await Jimp.read(file); 
     banner 
       .composite(avatar, 30, 5) 
       .print( 
         font, 
         140, 
         10, 
         { 
           text: tag, 
           alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT, 
           alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE, 
         }, 
         600 
       ) 
       .print( 
         font, 
         145, 
         55, 
         { 
           text: 'Just joined the server', 
           alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT, 
           alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE, 
         }, 
         430 
       ); 
     encoder.addFrame(banner.bitmap.data); 
   } 
   encoder.finish(); 
   const buffer = encoder.out.getData(); 
   let file = new AttachmentBuilder(buffer, {name: 'godnessgraciousness.gif'});
   let channel = client.channels.cache.get(channel_id); 
   await channel.send({ 
     content: `Namaste saar <@${member.user.id}> cummed in sarvar`, 
     files: [file], 
   });
 }
    async function sendPajeet(member, client) { 
   let avatar = await Jimp.read( 
     member.user.displayAvatarURL({ 
       extension: 'png', 
       forceStatic: true, 
     }) 
   ); 
   avatar.resize(275, 275); 
   avatar.circle(); 
   let banner = await Jimp.read( 
     'https://media.discordapp.net/attachments/1063000940279509022/1105098775652995124/PicsArt_05-08-05.14.41.png' 
   ); 
   banner.composite(avatar, 50, 78); 
   let buffer = await banner.getBufferAsync(Jimp.MIME_PNG); 
   let file = new AttachmentBuilder(buffer, {name: 'aagaya_muh_uthake.png'}); 
   let channel = client.channels.cache.get('1065736446981451776'); 
   return channel.send({ 
     content: `Namaste sirs <@${member.user.id}> did poo in the loo`, 
     files: [file], 
   }); 
 }
  }
};
