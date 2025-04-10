import {
  ChatInputCommandInteraction,
  AttachmentBuilder,
  Client,
} from "discord.js";

export default {
  data: {
    name: "contact",
    description: "Suggestions, Bug Reports, Features Reports.",
    options: [
      {
        type: 3,
        name: "message",
        description: "Your message",
        required: true,
      },
      {
        type: 11,
        name: "attachment",
        description: "Add screenshhots.",
        required: false,
      },
    ],
  },
  /**
   * @param {ChatInputCommandInteraction} interaction
   * @param {Client} client
   */
  execute: async (interaction, client) => {
    await interaction.deferReply({
      ephemeral: true,
    });
    let msg = interaction.options.getString("message");
    let attachment = interaction.options.getAttachment("attachment");
    let channelId = "1051571067606544575";
    let channel = client.channels.cache.get(channelId);
    let query = {
      content: [
        `**New message** <@1258396025354453054>`,
        `**User:**- ${interaction.member.user.username} (${interaction.member.id})`,
        `**Server**- ${interaction.guild.name} (${interaction.guild.id})`,
        `**Message-** ${msg}`,
      ].join("\n"),
    };
    if (attachment) {
      let img = new AttachmentBuilder(attachment.url, {
        name: attachment.filename,
      });
      query.content += "\n**Attachment**-";
      query.files = [img];
    }
    await channel.send(query);

    return interaction.followUp({
      content: "",
      ephemeral: true,
      embeds: [
        {
          description: "✅ Your message has been sent",
          color: 0xe08e67,
        },
      ],
    });
  },
};
