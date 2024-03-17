import { Message } from "discord.js";

export default {
  name: "connect4",
  description: "Play connect 4 on discord",
  aliases: ["c4"],
  usage: "connect4 @user1",
  guildOnly: true,
  args: false,
  permissions: {
    bot: [],
    user: [],
  },
  /**
    * @param {Message} message
    */
  execute: async (message) => {
    const emptyDisk = "<:emptyDisk:1102228471448604823>";
    const redCircle = "🔴";
    const yellowCircle = "🟡";
    let desc = [ 
   `${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}`, 
   `${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}`, 
   `${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}`, 
   `${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}`, 
   `${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}`, 
   `${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}`, 
 ]; 
 let randBool = Math.random() < 0.5; 
 let content = 
   message.mentions.users.size === 0 
     ? `${redCircle}<@${message.author.id}> **VS** ${yellowCircle}**me**\nYour turn ${redCircle}<@${message.author.id}> :` 
     : randBool  
      ? `${redCircle}<@${message.author.id}> **VS** ${yellowCircle}<@${message.mentions.users.first().id}>\nYour turn ${redCircle}<@${message.author.id}> :` 
     : `${redCircle}<@${message.mentions.users.first().id}> **VS** ${yellowCircle}<@${message.author.id}>\nYour turn ${redCircle}<@${message.mentions.users.first().id}> :`; 
  
 message.channel.send({ 
  
   content: content, 
   tts: false, 
   embeds: [ 
     { 
       type: 'rich', 
       title: `🔢 Connect 4`, 
       description: desc.join('\n'), 
       color: 0xe08e67, 
       footer: { 
         text: `The first player to connect 4 disks horizontally, vertically, or diagonally wins!`, 
       }, 
       fields: [ 
         { 
           name: '1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣\n__Click the buttons to drop__', 
           value: '`The highlighted button indicates the last move played.`', 
        }, 
       ],
     }, 
   ], 
   components: [ 
     { 
       type: 1, 
       components: [ 
         { 
           style: 2, 
           custom_id: `oneC4`, 
           disabled: false, 
           emoji: {id: null, name: `1️⃣`}, 
           type: 2, 
         }, 
         { 
           style: 2, 
           custom_id: `twoC4`, 
           disabled: false, 
           emoji: {id: null, name: `2️⃣`}, 
           type: 2, 
         }, 
         { 
           style: 2, 
           custom_id: `threeC4`, 
           disabled: false, 
           emoji: {id: null, name: `3️⃣`}, 
           type: 2, 
         }, 
         { 
           style: 2, 
           custom_id: `fourC4`, 
           disabled: false, 
           emoji: {id: null, name: `4️⃣`}, 
           type: 2, 
         }, 
       ], 
     }, 
     { 
       type: 1, 
       components: [ 
           { 
           style: 2, 
           custom_id: `fiveC4`, 
           disabled: false, 
           emoji: {id: null, name: `5️⃣`}, 
           type: 2, 
         }, 
         { 
           style: 2, 
           custom_id: `sixC4`, 
           disabled: false, 
           emoji: {id: null, name: `6️⃣`}, 
           type: 2, 
         }, 
         { 
           style: 2, 
           custom_id: `sevenC4`, 
           disabled: false, 
           emoji: {id: null, name: `7️⃣`}, 
           type: 2, 
         }, 
       ], 
     }, 
   ], 
 });
  }
};
