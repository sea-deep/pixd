import { Client } from "discord.js";

const emptyDisk = "<:emptyDisk:1102228471448604823>";
const yellowDisk = "<:yellowDisk:1102228894209294371>";
const redDisk = "<:redDisk:1102229231527809025>";
const redCircle = "🔴";

export default {
  name: "rematchC4",
  /**
   * @param {Client} client
   */
  execute: async (interaction, client) => {
    await client.interactionDefer(interaction);

    let message = interaction.message;
    let content = message.content.split("\n");
    let components;

    if (!message.content.includes(interaction.member.id)) {
      return interaction.followUp({
        content: "❌ **This is not your game.**",
        ephemeral: true,
      });
    }

    let desc = message.embeds[0].description.split("\n");

    if (message.mentions.users.size !== 1) {
      if (interaction.component.label === "Rematch (1/2)") {
        let hasClicked = client.keyv.get(`${interaction.member.id}_rematch`);
        if (hasClicked) {
          return interaction.followUp({
            content: "❌ **You've already clicked the button**",
            interaction: true,
          });
        }

        client.keyv.delete(`${interaction.member.id}_rematch`);
        let randBool = Math.random() < 0.5;
        content[0] = randBool
          ? `${redDisk}<@${message.mentions.parsedUsers.first().id}> VS ${yellowDisk}<@${message.mentions.parsedUsers.at(1).id}>`
          : content[0];
        content[1] = `**Your turn** ${redCircle}<@${interaction.message.mentions.parsedUsers.first().id}> :`;

        desc = Array(6).fill(
          `${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}`,
        );
        components = createComponents();
      } else {
        client.keyv.set(`${interaction.member.id}_rematch`, true);
        components = [
          {
            type: 1,
            components: [
              {
                label: "Rematch (1/2)",
                style: 1,
                custom_id: "rematchC4",
                disabled: false,
                emoji: { id: null, name: "↪️" },
                type: 2,
              },
            ],
          },
        ];
      }
    } else {
      content[1] = `Your turn ${redCircle}<@${interaction.member.id}> :`;
      desc = Array(6).fill(
        `${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}`,
      );
      components = createComponents();
    }
    await message.edit({
      content: content.join("\n"),
      tts: false,
      embeds: [
        {
          type: "rich",
          title: "🔢 Connect 4",
          description: desc.join("\n"),
          color: 0x53ff33,
          footer: message.embeds[0].footer,
          fields: message.embeds[0].fields,
        },
      ],
      components: components,
    });
  },
};

function createComponents() {
  return [
    {
      type: 1,
      components: [
        {
          style: 2,
          custom_id: "oneC4",
          disabled: false,
          emoji: { id: null, name: "1️⃣" },
          type: 2,
        },
        {
          style: 2,
          custom_id: "twoC4",
          disabled: false,
          emoji: { id: null, name: "2️⃣" },
          type: 2,
        },
        {
          style: 2,
          custom_id: "threeC4",
          disabled: false,
          emoji: { id: null, name: "3️⃣" },
          type: 2,
        },
        {
          style: 2,
          custom_id: "fourC4",
          disabled: false,
          emoji: { id: null, name: "4️⃣" },
          type: 2,
        },
      ],
    },
    {
      type: 1,
      components: [
        {
          style: 2,
          custom_id: "fiveC4",
          disabled: false,
          emoji: { id: null, name: "5️⃣" },
          type: 2,
        },
        {
          style: 2,
          custom_id: "sixC4",
          disabled: false,
          emoji: { id: null, name: "6️⃣" },
          type: 2,
        },
        {
          style: 2,
          custom_id: "sevenC4",
          disabled: false,
          emoji: { id: null, name: "7️⃣" },
          type: 2,
        },
      ],
    },
  ];
}
