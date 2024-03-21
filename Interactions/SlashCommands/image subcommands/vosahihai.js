import sharp from 'sharp';

export default {
  subCommand: 'img vosahihai',
  async execute(interaction) {
    await interaction.deferReply();
    const url = await getInputImage(interaction.options);
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    let options = { fit: "fill", background: { r: 0, g: 0, b: 0, alpha: 0 } };
    let head = await sharp(buffer)
      .resize(720, 800, options)
      .rotate(-15, options)
      .toBuffer();
    let hand = await sharp("./Assets/vosahihai.png")
      .resize(550, 720, options)
      .toBuffer();

    const sahi = await sharp({
      create: {
        width: 1080,
        height: 1080,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: head, top: 0, left: 200 },
        { input: hand, top: 150, left: 5 },
      ]).png()
      .toBuffer();
    const vosahi = await sharp(sahi).resize(1080, 855, {position: "top"}).png().toBuffer();

    let file = new AttachmentBuilder(vosahi, { name: "maisahitha.png" });
    let text = [
      "vo kuch thug hai",
      "vo to koi thug nahi hai",
      "vo sahi hai",
      "vo galat hai",
      "vo real hai",
      "vo sach hai",
      "vo fake hai",
      "vo <:genesis:992613277995642961> hai",
    ];
    return interaction.followUp({
      content: text[Math.round(Math.random() * text.length)],
      files: [file],
    });
  }
};

async function getInputImage(options) {
  const opt = options._hoistedOptions;
  if(opt && opt.length !== 0) {
  switch (opt[0].name) {
  case "user":
    return opt[0].user.displayAvatarURL({
      forceStatic: true,
      extension: 'png'
    });
  case 'image-url':
    return opt[0].match(/(https?:\/\/\S+\.(?:png|mp4|jpg|gif|jpeg)(?:\?[^\s]+)?)/i)[0];
  case 'image-file':
    return opt[0].attachment.url;
  default:
    break;
  }
  }
  return interaction.user.displayAvatarURL({
      forceStatic: true,
      extension: 'png'
    });
}