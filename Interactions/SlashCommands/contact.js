import { ChatInputCommandInteraction, AttachmentBuilder, Client } from "discord.js";

export default {
  data: {
    name: 'contact',
    description: 'Suggestions, Bug Reports, Features Reports.',
    options: [
      {
        type: 3,
        name: 'message',
        description: 'Your message',
        required: true
      },
      {
        type: 11,
        name: 'attachment',
        description: 'Add screenshhots.',
        required: false
      }
    ]
  },
  /**
   * @param {ChatInputCommandInteraction} interaction 
   * @param {Client} client
   */
  execute: async(interaction, client) => {
    let msg = interaction.options.getString('message');
   let attachment = interaction.options.getAttachment('attachment');
  let channelId = "1051571067606544575";
  let channel = client.channels.cache.get(channelId);
    let query = {
      content: [
    `**New message** <@908287391217905684>`,
`**User:**- ${interaction.member.user.username} (${interaction.member.id})`,
`**Server**- ${interaction.guild.name} (${interaction.guild.id})`,
`**Message-** ${msg}`
  ].join('\n')};
    if(attachment) {
      let img = new AttachmentBuilder(attachment.url, { name: attachment.filename});
      query.content += '\n**Attachment**-';
      query.files = [ img ]
    }
  await channel.send(query);

  return interaction.reply({
    content: 'Your message has been sent to the devalepor!',
    ephemeral: true
  })
  }
};
