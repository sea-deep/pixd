import sharp from 'sharp';
import { AttachmentBuilder } from 'discord.js';
import { getInputImageInt } from '../../../Helpers/helpersImage.js';

export default {
  subCommand: 'img rap',
  async execute(interaction) {
    await interaction.deferReply();
    const url = await getInputImageInt(interaction);
    const allCords = [
      { x: 0, y: 0 },
      { x: 366, y: 0 },
      { x: 0, y: 500 },
      { x: 366, y: 500 },
    ];
    const position = allCords[Math.floor(Math.random() * 4)];
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const avatar = await sharp(buffer).resize(366, 500, {fit: "fill"}).toBuffer();
    const rapper = await sharp("./Assets/rap.jpg")
      .resize(732, 1000)
      .composite([
        { input: avatar, top: position.y, left: position.x },
      ])
      .png()
      .toBuffer();
    let file = new AttachmentBuilder(rapper, { name: "nirbhaya.png" });
    await interaction.followUp({
      content: "",
      files: [file],
    });
  }
};