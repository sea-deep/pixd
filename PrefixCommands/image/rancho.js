import { AttachmentBuilder, Message, Client } from "discord.js";
import sharp from "sharp";

export default {
  name: "alliswell",
  description: "Create 3 idiots poster",
  aliases: ["idiots", "rastogi", "farhan", "3idiots", "rancho"],
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
    const ids = message.content.match(/<@(\d+)>/g);
    if (!ids || ids.length < 3) {
      return message.reply("Please mention 3 peoples 🤓");
    }
    let idArray = ids.map((id) => id.slice(2, -1));
    let avatars = [];
    for (let i = 0; i < idArray.length; i++) {
      let user = await client.users.fetch(idArray[i]);
      let url = user.displayAvatarURL({
        extension: "png",
        forceStatic: true,
      });
      const res = await fetch(url);
      const buffer = await res.arrayBuffer();
      avatars.push(buffer);
    }
    for (let i = avatars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [avatars[i], avatars[j]] = [avatars[j], avatars[i]];  // Swap elements
      }
    const data = [
        [
          { height: 100, width: 100, top: 427, left: 66 },
          { height: 100, width: 100, top: 446, left: 288 },
          { height: 100, width: 100, top: 416, left: 555 }
        ],
        [
          { height: 91, width: 91, top: 435, left: 90 },
          { height: 91, width: 91, top: 450, left: 294 },
          { height: 91, width: 91, top: 431, left: 538 }
        ],
        [
          { height: 176, width: 176, top: 346, left: 276 },
          { height: 143, width: 143, top: 441, left: 544 },
          { height: 176, width: 176, top: 420, left: 2 }
        ],
        [
          { height: 138, width: 138, top: 74, left: 103 },
          { height: 138, width: 138, top: 79, left: 294 },
          { height: 138, width: 138, top: 70, left: 485 }
        ],
        [
          { height: 120, width: 120, top: 255, left: 119 },
          { height: 120, width: 120, top: 274, left: 444 },
          { height: 120, width: 120, top: 261, left: 776 }
        ]
      ];
      
    let randIndex = Math.floor(Math.random() * 5);
    let verdict = data[randIndex];
  
      const options = {
        fit: "fill",
      };
    let avatar1 = await sharp(avatars[0]).resize(verdict[0].width,verdict[0].height , options).toBuffer();
    let avatar2 = await sharp(avatars[1]).resize(verdict[1].width,verdict[1].height , options).toBuffer();
    let avatar3 = await sharp(avatars[2]).resize(verdict[2].width,verdict[2].height , options).toBuffer();




    const idiots = await sharp(`./Assets/idiot/_${randIndex+1}.jpg`)
    .png()
        .composite([
            { input: avatar1, top: verdict[0].top, left: verdict[0].left },
            { input: avatar2, top: verdict[1].top, left: verdict[1].left },
            { input: avatar3, top: verdict[2].top, left: verdict[2].left },
        ])
        .png()
        .toBuffer();
  
  

        const b = [
            "All is well.",
            "Aal izz well!",
            "Do not chase success. Instead, chase excellence, success will follow you.",
            "Babu Moshai Zindagi Badi Haseen Hai, Padhayi Ki Chinta Mat Karo.",
            "Success ke peeche mat bhago, excellence ke peeche bhago, success jhak maar ke tumhare peeche ayega.",
            "Jab tak toofan ke aane ki awaaz na suno, tab tak samundar mein behne ka maza nahi aata.",
            "Agar tum koshish karoge toh tumhare saath duniya ki taqat lag jaayegi.",
            "Life is a race, if you don’t run fast, you’ll be like a broken anda.",
            "Kaabil bano, duniya apne aap tumhare paas ayegi.",
            "I am not a 'chamatkari' doctor, I am a 'chhoti' doctor.",
            "Aaj kal humari aankhon mein koi sapne nahi, khauf hai.",
            "Chatur's voice is like my grandmother's idea of 'fun.'",
            "Dil se padhai kar, success toh apne aap aayegi.",
            "Zindagi mein kisi kaam ko karte waqt agar tumhe maza aa raha hai, toh samajh jao ki woh kaam tumhara hai.",
            "Pehle apni zindagi mein aise sapne dekho ki unhein sach karne ki takat tum khud me paayein.",
            "Maa ke bina ghar kya hota hai... jaane bhi do yaar, chhodo!",
            "Kisi bhi kaam ko aise karo ki usme tumhe khud ka maza aaye, aur phir jo tum karoge woh sabko pasand aayega.",
            "Jo karte ho usse pyaar karo, bas baat khatam.",
            "Zindagi mein ek hi waqt mein ek kaam karna chahiye, aur woh kaam karne ke liye apne puri taqat laga do.",
            "Agar tumhein kuch seekhne ka dil hai toh sabhi raste khud tumhe dikhayi denge."
          ];
          

    const line = b[Math.floor(Math.random() * b.length)];
    let file = new AttachmentBuilder(idiots, { name: "idiot.png" });
    return message.reply({
      content: line,
      files: [file],
    });
  },
};
