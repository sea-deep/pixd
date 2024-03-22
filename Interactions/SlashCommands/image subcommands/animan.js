import { AttachmentBuilder } from "discord.js";
import sharp from "sharp";

export default {
  subCommand: 'img animan',
  async execute (interaction) {
   await interaction.deferReply();
    let avatars = []; 
   for (let i = 0; i < 4; i++) { 
     let user = await interaction.options._hoistedOptions[i].user;
     let url = await user.displayAvatarURL({ 
      extension: 'png', 
      forceStatic: true 
    }); 
     const res = await fetch (url);
     const buffer = await res.arrayBuffer();
     avatars.push(buffer);
   }
    const options = {
      fit: "fill"
    };
   let bg = await sharp("./Assets/animan.png").resize(720, 762,options).toBuffer();
   let avatar1 = await sharp(avatars[0]).resize(80,80,options).toBuffer();
   let avatar2 = await sharp(avatars[1]).resize(148, 144, options).toBuffer(); 
   let avatar3 = await sharp(avatars[2]).resize(123, 112, options).toBuffer();
   let avatar4 = await sharp(avatars[3]).resize(100, 110, options).toBuffer(); 

   const animan = await sharp({
     create: {
       width: 720,
       height: 762,
       channels: 4,
       background: { r: 0, g: 0, b: 0, alpha: 0 },
     }
   }).composite([
     {input: avatar2, top:527, left: 156},
     {input: avatar3, top: 581, left: 363},
     {input: avatar4, top: 527, left: 555},
     {input: bg, top: 0, left: 0},
     {input: avatar1, top: 38, left: 291}
   ]).png().toBuffer();
     
   
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
   let file = new AttachmentBuilder(animan, {name: 'animan.png'}); 
   return interaction.followUp({ 
     content: line, 
     files: [file], 
   });
  }
};