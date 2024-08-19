import { getInputImageInt } from "../../../Helpers/helpersImage.js";
import sharp from "sharp";
import GIFEncoder from "gif-encoder-2";
import { AttachmentBuilder } from "discord.js";

export default {
  subCommand: "img goodness",
  async execute(interaction) {
    await interaction.deferReply();
    let url = await getInputImageInt(interaction);
    let res = await fetch(url);
    let buffer = await res.arrayBuffer();
    let avatar = await sharp(buffer).resize(160, 157).toBuffer();
    const encoder = new GIFEncoder(260, 296);
    encoder.setDelay(50);
    encoder.start();
    for (let i = 0; i < 34; i++) {
      const frame = i < 10 ? `0${i}` : `${i}`;

      let good = sharp(
        `./Assets/goodness/frame_${frame}_delay-0.05s.gif`,
      ).composite([{ input: avatar, top: 139, left: 101 }]);
      const { data } = await good.raw().toBuffer({ resolveWithObject: true });
      encoder.addFrame(data);
    }
    encoder.finish();
    const goodness = encoder.out.getData();
    let file = new AttachmentBuilder(goodness, {
      name: "godnessgraciousness.gif",
    });
    await interaction.followUp({
      content: ``,
      files: [file],
    });
  },
};
