export async function getInputImage(message, opt) {
   let static = true;
   if (opt.dynamic) { static = false }
   if (message.attachments.size >= 1) { 
     return message.attachments.first().url; 
   } 
  
   if (message.stickers.size >= 1) { 
     return `https://cdn.discordapp.com/stickers/${ 
       message.stickers.first().id 
     }.png`; 
   } 
  
   if (/<:[^:]+:(\d+)>/.test(message.content)) { 
     let emojiId = RegExp.$1; 
     return `https://cdn.discordapp.com/emojis/${emojiId}.png`; 
   } 
  
   if (/https?:\/\/.*\.(?:png|jpg|jpeg|gif)/i.test(message.content)) { 
     return RegExp['$&']; 
   } 
  
   if (message.reference) { 
     let refMsg = await message.channel.messages.fetch( 
       message.reference.messageId 
     ); 
  
     if (refMsg.attachments.size >= 1) { 
       return refMsg.attachments.first().url; 
     } 
  
     if (/https?:\/\/.*\.(?:png|jpg|jpeg|gif)/i.test(refMsg.content)) { 
       return RegExp['$&']; 
     } 
  
     if (/<:[^:]+:(\d+)>/.test(refMsg.content)) { 
       let emojiId = RegExp.$1; 
       return `https://cdn.discordapp.com/emojis/${emojiId}.png`; 
     } 
  
     if (refMsg.stickers.size >= 1) { 
       return `https://cdn.discordapp.com/stickers/${ 
         refMsg.stickers.first().id 
       }.png`; 
     } 
   } 
  
   if (message.mentions.users.size >= 1) { 
     return message.mentions.users.first().displayAvatarURL({ 
       extension: 'png', 
       forceStatic: static, 
     }); 
   } 
  
   return message.member.user.displayAvatarURL({ 
     extension: 'png', 
     forceStatic: static, 
   }); 
 }
 
export async function getCaptionInput(message) {
  let image = null;

  if (message.attachments.size >= 1) {
    image = message.attachments.first().url;
  } else if (message.stickers.size >= 1) {
    image = `https://cdn.discordapp.com/stickers/${message.stickers.first().id}.png`;
  } else if (/<:[^:]+:(\d+)>/.test(message.content)) {
    const emojiId = RegExp.$1;
    image = `https://cdn.discordapp.com/emojis/${emojiId}.png`;
  } else if (/https?:\/\/.*\.(?:png|jpg|jpeg|gif)/i.test(message.content)) {
    image = RegExp['$&'];
  }

  if (!image && message.reference) {
    const refMsg = await message.channel.messages.fetch(message.reference.messageId);

    if (refMsg.attachments.size >= 1) {
      image = refMsg.attachments.first().url;
    } else if (/https?:\/\/.*\.(?:png|jpg|jpeg|gif)/i.test(refMsg.content)) {
      image = RegExp['$&'];
    } else if (/<:[^:]+:(\d+)>/.test(refMsg.content)) {
      const emojiId = RegExp.$1;
      image = `https://cdn.discordapp.com/emojis/${emojiId}.png`;
    } else if (refMsg.stickers.size >= 1) {
      image = `https://cdn.discordapp.com/stickers/${refMsg.stickers.first().id}.png`;
    }
  }

  if (!image) {
    const messages = await message.channel.messages.fetch({ limit: 50 });
    messages.reverse().forEach((msg) => {
      if (!image) {
        if (msg.attachments.size >= 1) {
          image = msg.attachments.first().url;
        } else if (msg.stickers.size >= 1) {
          image = `https://cdn.discordapp.com/stickers/${msg.stickers.first().id}.png`;
        } else if (/https?:\/\/.*\.(?:png|jpg|jpeg|gif)/i.test(msg.content)) {
          image = RegExp['$&'];
        }
      }
    });
  }

  return image;
}


