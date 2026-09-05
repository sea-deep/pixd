import HybridCommand from "../../structures/HybridCommand.js";
import { commandInput } from "../../helpers/commandInput.js";
import { AttachmentBuilder } from "discord.js";
import sharp, { type OverlayOptions } from "sharp";
import { renderTextWithEmojis } from "../../helpers/textEmojiRenderer.js";

export default new HybridCommand({
  name: "emiwaysay",
  description: "Run emiwaysay with transparent custom emoji support.",
  aliases: ["emiway", "es"],
  usage: "emiwaysay [caption text]",
  guildOnly: true,
  permissions: {
    bot: [],
    user: [],
  },
  options: [
    { type: 3, name: "arguments", description: "Command text and arguments, in prefix order" },
    { type: 6, name: "user", description: "Target user" },
    { type: 6, name: "user2", description: "Second target" },
    { type: 6, name: "user3", description: "Third target" },
    { type: 11, name: "image", description: "Input image or attachment" },
  ],
  execute: async (ctx, client) => {
    const input = commandInput(ctx);
    const args = input.args;
    const captionText = args.join(" ").trim() || "...";

    // Speech bubble area: width 1148 (1778 - 630), height 610
    const textOverlay = await renderTextWithEmojis(captionText, {
      font: "gg sans",
      fontfile: "./Assets/ggsans-ExtraBold.ttf",
      textColor: "#000000",
      bgColor: "transparent",
      maxWidth: 1148 - 40,
      maxHeight: 610 - 40,
      lineHeight: 70,
      emojiSize: 56,
      spaceWidth: 16,
      maxUnitsPerLine: 24,
      align: "center",
    });

    const randomNumber = Math.floor(Math.random() * 3) + 1;
    const composites: OverlayOptions[] = [
      {
        input: `./Assets/emiway${randomNumber}.png`,
        top: 0,
        left: 1778 - 630,
      },
    ];

    if (textOverlay) {
      composites.push({
        input: textOverlay.buffer,
        top: 20 + Math.max(0, Math.floor(((610 - 40) - textOverlay.height) / 2)),
        left: 20 + Math.max(0, Math.floor(((1148 - 40) - textOverlay.width) / 2)),
      });
    }

    const output = await sharp({
      create: {
        width: 1778,
        height: 630,
        channels: 4,
        background: {
          r: 255,
          g: 255,
          b: 255,
          alpha: 1,
        },
      },
    })
      .composite(composites)
      .png()
      .toBuffer();

    const file = new AttachmentBuilder(output, { name: "bantai.png" });
    return ctx.reply({
      content: await getRandomLine(),
      files: [file],
    });
  },
});

function getRandomLine() {
  const lyrics = [
    "Haan kya bolti company",
    "Haan hosh mein hai ki nahi",
    "Sab log idhaar pe kya shot",
    "Emiway bantai",
    "Aur bantai wale yaad hain na",
    "Aa phirse aage le",
    "Haan kya bolti hai company",
    "Kamayle bohat money",
    "Inko lag raha shane ban rahe",
    "Agle lag rahe bohat funny",
    "Aapa chalein mat kar",
    "Aaiba apun kattar",
    "37 sattar 17 tak pechaan hai",
    "Haan kya bolti hai company",
    "Kamayle bohat money",
    "Inko lag raha shane ban rahe",
    "Agle lag rahe bohat funny",
    "Aapa chalein mat kar",
    "Aaiba apun kattar",
    "37 sattar 17 tak pechaan hai",
    "Khaana chod dein button",
    "Paya nalla mutton",
    "Kya bolte ratan",
    "Anmol hai ki nahi",
    "Yaad karao kidhar bhi jao",
    "Lekin idhar mat marao",
    "Desh mein rehna ki nahi ya",
    "Passport visa karao",
    "Haan hosh mein sab soch mein",
    "Kaise aaun Emiway Bantai ke pahunch mein",
    "Andhere mein lala apun banke ghoome roshni",
    "Apna khaya haq se na khaya kiska noch ke",
    "Haan hai kidhar, ab dekhh idhar",
    "Chhokhre saare ghoom rahe ekdam befikar",
    "Ek nazar phir kaun gadar",
    "Haan kya chaiye tere ko bas tu bol brother",
    "Haan khud ki izzat pyaari hai",
    "To dusron ki bhi kar",
    "Warna zillat denge poori",
    "Zindagi rahenga dar",
    "I representing India bole toh Hindustan",
    "One five down two five seedha qabaristan",
    "Haan kya bolti hai company",
    "Kamayle bohat money",
    "Inko lag raha shane ban rahe",
    "Agle lag rahe bohat funny",
    "Aapa chaale maat kar",
    "Aaiba apun kattar",
    "37 sattar 17 tak paichaan hai",
    "Haan kya bolti hai company",
    "Kamayle bohat money",
    "Inko lag raha shane ban rahe",
    "Agle lag rahe bohat funny",
    "Aapa chalein mat kar",
    "Aaiba apun kattar",
    "37 sattar 17 tak pechaan hai",
    "Ab bhai bhaykhala mein",
    "Behan bhindi bazaar mein",
    "Aur dada daadar mein",
    "Malum na father mein lala",
    "Hosh mein company kya",
    "Aankh khuli andhe ke",
    "Door rehna warna teri",
    "Shot ho jayegi dhandhe ki kya",
    "Haan company",
    "Haan peti nehi khoka hai",
    "Pyaar hai ek dhokha hai",
    "Dil laga sahi jagah",
    "Ek aur mauka hai",
    "Arzz kiya hai",
    "Apne liye lade to hum bure ho gaye",
    "Kya apne liye lade to hum bure ho gaye",
    "Ya to neend poori ho gayi",
    "Ya to khwab poore ho gaye",
    "Haan sacchi baat bata raha",
    "Kaun hai gareeb ka sahara",
    "Dus hazaar deposit, do hazaar bhaada",
    "Abhi kidhar nahi hai",
    "Kaayar logon mein jigar nahi hai",
    "Khud se bane lala",
    "Isliye zindagi mein fikar nahi hai",
    "Haan kya bolti hai company",
    "Kamayle bohat money",
    "Inko lag raha shane ban rahe",
    "Agle lag rahe bohat funny",
    "Aapa chalein mat kar",
    "Aaiba apun kattar",
    "37 sattar 17 tak pechaan hai",
    "Haan kya bolti hai company",
    "Kamayle bohat money",
    "Inko lag raha shane ban rahe",
    "Agle lag rahe bohat funny",
    "Aapa chalein mat kar",
    "Aaiba apun kattar",
    "37 sattar 17 tak pechaan hai",
    "Haan andar se tu naram",
    "Phateli kar raha baahar se",
    "Har koyi kalakaar",
    "Koyi nahi kam gunehgar se",
    "Sudhar geyele maa baap ko",
    "Ghuma rahele car se",
    "Teer na talwar se darte parwardigar se",
    "Duniyadari chhod beta kaam dhandhe lag ja",
    "Sudhar geyele apne tak aaya to phir samajh ja",
    "Tujhse shana lala mere area ka baccha",
    "Maa boli mehnat kar galat raste mat ja",
    "Ab baatein nahi samjha rahi hai",
    "To jaane de, haan jaane de",
    "Haan pehli fursat nikaal",
    "Doorsi wali ko aane de",
    "Lebel wale bolein humko gaane de",
    "De diya jhol liya",
    "Label ke sath macha rahele",
    "Haan darwaze pe thak thak",
    "Paisa aa rahe phatt phatt",
    "Lage rahe munna bhai",
    "Raaste se tu hat mat",
    "Aaj karega mehnat fun hoga tera kal",
    "Hoga tu safal bas aage badta chal",
    "Chal, chal, chal",
  ];
  const randomIndex = Math.floor(Math.random() * lyrics.length);
  return lyrics[randomIndex];
}
