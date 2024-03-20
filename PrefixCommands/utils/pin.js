import { Client, Message } from "discord.js";

export default {
  name: "pin",
  description: "Make pins in your discord server.",
  aliases: ["n"],
  usage: null,
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
    switch (args[0].trim()) {
      case "add":
      case "create":
      case "new":
      case "edit":
        return createPin(message, args, client);
      case "remove":
      case "delete":
      case "del":
        return removePin(message, args, client);
      case "list":
        return listPin(message, args, client);
      default:
        return viewPin(message, args, client);
    }
  },
};

async function createPin(message, args, client) {
  if (args.length < 2) {
    return message.reply({
      content: "",
      embeds: [
        {
          description: "❌ **Please provide a name for the pin**",
          color: client.color,
        },
      ],
    });
  }
  let restricted = [
     'add',
     'create',
     'new',
     'edit',
     'remove',
     'delete',
     'del',
     'list'
    ];
  if (restricted.includes(args[1].trim().toLowerCase())) {
    return message.reply({
      content: "",
      embeds: [
        {
          description: "❌ **You cannot create a tag with this name.**",
          color: client.color,
        },
      ],
    });
  }
  await client.pinsDB.connect();
  
  let pin = await client.pinsDB.get(message.guild.id + args[1].trim().toLowerCase());
  if(pin && message.author.id !== pin.owner) {
   return message.reply({
      content: "",
      embeds: [
        {
          description: "❌ **You cannot update this pin.**",
          color: client.color,
        },
      ],
    });
  }
  
  const pinContentString = args.slice(2).join(" ");

  let pinContent = {
    attachment:
      message.attachments.size > 0
        ? message.attachments.first().url
        : message.reference
        ? (await message.fetchReference()).attachments.size > 0
          ? (await message.fetchReference()).attachments.first().url
          : null
        : /(https?:\/\/.*\.(?:png|mp4|jpg|gif|jpeg))/i.test(
            pinContentString
          )
        ? pinContentString.match(
            /(https?:\/\/.*\.(?:png|jpg|mp4|gif|jpeg))/i
          )[0]
        : null,
    content: message.reference
      ? (await message.fetchReference()).content.trim() === ''
        ? null
        : /(https?:\/\/.*\.(?:png|mp4|jpg|gif|jpeg))/i.test((await message.fetchReference()).content)
         ? null
         : (await message.fetchReference()).content
      : /(https?:\/\/.*\.(?:png|mp4|jpg|gif|jpeg))/i.test(pinContentString)
        ? null
        : pinContentString.trim() !== ""
          ? pinContentString.trim()
          : null,
    owner: message.author.id,
  };

  if (!pinContent.content && !pinContent.attachment) {
    return message.reply({
      content: "",
      embeds: [
        {
          description: "❌ **Please provide the content for the pin**",
          color: client.color,
        },
      ],
    });
  }

  await client.pinsDB.connect();
  await client.pinsDB.set(
    message.guild.id + args[1].trim().toLowerCase(),
    pinContent
  );
  await client.pinsDB.close();
  return message.reply({
    content: "",
    embeds: [
      {
        description: `**Successfully created the pin \`${args[1]}\`**`,
        color: client.color,
      },
    ],
  });
}


async function viewPin(message, args, client) {
  if (args.length < 1) {
    return message.reply({
      content: "",
      embeds: [
        {
          description:
            "❌ **Please provide the name of the pin you want to view**",
          color: client.color,
        },
      ],
    });
  }

  const pinName = message.guild.id + (args[0].trim().toLowerCase());
  await client.pinsDB.connect();
  const pinContent = await client.pinsDB.get(pinName);
  await client.pinsDB.close();

  if (!pinContent) {
    return message.reply({
      content: "",
      embeds: [
        {
          description: `❌ **No pin found with the name \`${args[0]
            .trim()
            .toLowerCase()}\`**`,
          color: client.color,
        },
      ],
    });
  }

  if (pinContent.attachment && pinContent.attachment.includes(".mp4")) {
    return message.reply({
      content: `${pinContent.attachment}`,
    });
  } else {
    return message.channel.send({
      content: "",
      embeds: [
        {
          description: pinContent.content || "",
          color: client.color,
          image: {
            url: pinContent.attachment || null,
          },
        },
      ],
    });
  }
}


async function removePin(message, args, client) {
  if (args.length < 2) {
    return message.reply({
      content: "",
      embeds: [
        {
          description: "❌ **Please provide the name of the pin you want to remove**",
          color: client.color,
        },
      ],
    });
  }

  const pinName = message.guild.id + args[1].trim().toLowerCase();
  await client.pinsDB.connect();
  const pinContent = await client.pinsDB.get(pinName);

  if (!pinContent) {
    await client.pinsDB.close();
    return message.reply({
      content: "",
      embeds: [
        {
          description: `❌ **No pin found with the name \`${args[1]}\`**`,
          color: client.color,
        },
      ],
    });
  }
   if(message.author.id !== pinContent.owner) {
   return message.reply({
      content: "",
      embeds: [
        {
          description: "❌ **You cannot delete this pin.**",
          color: client.color,
        },
      ],
    });
   }
  await client.pinsDB.delete(pinName);
  await client.pinsDB.close();

  return message.reply({
    content: "",
    embeds: [
      {
        description: `✅ **Successfully removed the pin \`${args[1]}\`**`,
        color: client.color,
      },
    ],
  });
}

async function listPin(message, args, client) {
  await client.pinsDB.connect();
  const pins = await client.pinsDB.all();
  await client.pinsDB.close();

  if (!pins || pins.length === 0) {
    return message.reply({
      content: "",
      embeds: [
        {
          description: "❌ **No pins found in the server**",
          color: client.color,
        },
      ],
    });
  }

  let filteredPins = pins.filter((pin) => pin.key.startsWith(message.guild.id));

  if (message.mentions.users.size > 0) {
    const mentionedUserId = message.mentions.users.first().id;
    filteredPins = filteredPins.filter((pin) => pin.value.owner === mentionedUserId);
  }

  const pinList = filteredPins.map((pin) => `\`${pin.key.replace(message.guild.id, "")}\``).join(", ");

  return message.reply({
    content: "",
    embeds: [
      {
        description: `**List of pins in the server:** ${pinList}`,
        color: client.color,
      },
    ],
  });
}