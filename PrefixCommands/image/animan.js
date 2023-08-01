import { AttachmentBuilder, Message, Client} from "discord.js";
import Jimp from "jimp";

export default {
  name: "animan",
  description: "we put the new forgis on the zip",
  aliases: ["anime"],
  usage: "animan @user1 @user2 @user3 @user4",
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
   await message.channel.sendTyping(); 
   const ids = message.content 
     .match(/<@(\d+)>/g); 
   if (!ids || ids.length < 4) { 
     return message.reply('Please mention 4 peoples 🤓'); 
   } 
   let idArray = ids.map((id) => id.slice(2, -1)); 
   let avatars = []; 
   for (let i = 0; i < idArray.length; i++) { 
     let user = await client.users.fetch(idArray[i]); 
    avatars.push(user.displayAvatarURL({ 
    extension: 'png', 
    forceStatic: true 
 })); 
   } 
   let bg = await Jimp.read( 'https://cdn.discordapp.com/attachments/916697198761234492/1098731085187252344/PicsArt_04-21-03.34.30.png' 
   ); 
   bg.resize(720, 762); 
   let avatar1 = await Jimp.read(avatars[0]); 
   let avatar2 = await Jimp.read(avatars[1]); 
   let avatar3 = await Jimp.read(avatars[2]); 
   let avatar4 = await Jimp.read(avatars[3]); 
  
   avatar1.resize(80, 80); 
   avatar2.resize(148, 144); 
   avatar3.resize(123, 112); 
   avatar4.resize(100, 110); 
   const animan = new Jimp(720, 762)
     .composite(avatar2, 156, 527) 
     .composite(avatar3, 363, 581) 
     .composite(avatar4, 555, 527) 
     .composite(bg, 0, 0) 
     .composite(avatar1, 291, 38); 
   let buffer = await animan.getBufferAsync(Jimp.MIME_PNG); 
  
   const b = [ 
     'I put the new Forgis on the Jeep', 
     'I trap until the bloody bottoms is underneath', 
     "'Cause all my niggas got it out the streets", 
     'I keep a hundred racks, inside my jeans', 
     "I remember hittin' the mall with the whole team", 
     "Now a nigga can't answer calls 'cause I'm ballin'", 
     "I was wakin' up gettin' racks in the morning", 
     "I was broke, now I'm rich, these niggs salty", 
     'All this designer on my body got me drip, drip, ayy', 
     "Straight up out the Yaadas, I'm a big Crip", 
     "If I got a pint of lean, I'ma sip, sip", 
     'I run the racks up with my queen like London and Nip', 
     "But I got rich on all these niggas I didn't forget back", 
     "I had to go through the struggle, I didn't forget that", 
     'I hopped inside of the Maybach and now I can sit back', 
     'These Chanel bags is a bad habit, I-I do not know how to act', 
   ]; 
  
   const line = b[Math.floor(Math.random() * b.length)]; 
   let file = new AttachmentBuilder(buffer, {name: 'animan.png'}); 
   return message.reply({ 
     content: line, 
     files: [file], 
   });
  }
};
