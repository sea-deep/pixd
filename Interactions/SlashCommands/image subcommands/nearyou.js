import { getInputImageInt } from '../../../Helpers/helpersImage.js';
import sharp from 'sharp';
import { AttachmentBuilder } from 'discord.js';

export default {
  subCommand: 'img nearyou',
  async execute(interaction) {
    await interaction.deferReply();
    let url = await getInputImageInt(message);
    let res = await fetch(url);
    let buffer = await res.arrayBuffer();
    let avatar = await sharp(buffer).resize(252, 252).toBuffer();
    const encoder = new GIFEncoder(360, 360);
    encoder.setDelay(150);
    encoder.start();
    for (let i = 0; i < 60; i++) {
      const frame = i < 10 ? `0${i}` : `${i}`;
      let near = sharp(
        `./Assets/nearframes/frame_${frame}_delay-0.17s.gif`,
      ).composite([{ input: avatar, top: 70, left: -21 }]);
      const { data } = await near.raw().toBuffer({ resolveWithObject: true });
      encoder.addFrame(data);
    }
    encoder.finish();
    const nearYou = encoder.out.getData();
    let file = new AttachmentBuilder(nearYou, {
      name: "godnessgraciousness.gif",
    });
    await interaction.followUp({
      content: ``,
      files: [file],
    });
  }
};