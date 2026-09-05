import type CommandContext from "../../helpers/CommandContext.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { commandInput, contextImage } from "../../helpers/commandInput.js";
import { Client, Message } from "discord.js";

export default new HybridCommand({
  name: "pin",
  description: "Make pins in your discord server.",
  aliases: ["n"],
  usage: "<add|remove|list|name> [name] [content]",
  guildOnly: true,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   * @param {Client} client
   */
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
    switch ((args[0] ?? "").trim()) {
      case "add":
      case "create":
      case "new":
      case "edit":
        return createPin(ctx, args, client);
      case "remove":
      case "delete":
      case "del":
        return removePin(ctx, args, client);
      case "list":
        return listPin(ctx, args, client);
      default:
        return viewPin(ctx, args, client);
    }
  },
});

async function createPin(ctx: CommandContext, args: string[], client: Client) {
  const input = commandInput(ctx);
  if (args.length < 2) {
    return ctx.reply({
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
    "add",
    "create",
    "new",
    "edit",
    "remove",
    "delete",
    "del",
    "list",
  ];
  if (restricted.includes(args[1].trim().toLowerCase())) {
    return ctx.reply({
      content: "",
      embeds: [
        {
          description: "❌ **You cannot create a tag with this name.**",
          color: client.color,
        },
      ],
    });
  }

  let pin = await client.pinsDB.get(
    ctx.guild!.id + args[1].trim().toLowerCase(),
  );
  if (pin && ctx.user.id !== pin.owner) {
    return ctx.reply({
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
      input.attachments.size > 0
        ? input.attachments.first()!.url
        : input.reference &&
            (await input.fetchReference()).attachments.size > 0
          ? (await input.fetchReference()).attachments.first()!.url
          : input.reference &&
              /(https?:\/\/\S+\.(?:png|mp4|jpg|gif|jpeg)(?:\?[^\s]+)?)/i.test(
                (await input.fetchReference()).content,
              )
            ? (await input.fetchReference()).content.match(
                /(https?:\/\/\S+\.(?:png|mp4|jpg|gif|jpeg)(?:\?[^\s]+)?)/i,
              )![0]
            : /(https?:\/\/\S+\.(?:png|mp4|jpg|gif|jpeg)(?:\?[^\s]+)?)/i.test(
                  pinContentString,
                )
              ? pinContentString.match(
                  /(https?:\/\/\S+\.(?:png|mp4|jpg|gif|jpeg)(?:\?[^\s]+)?)/i,
                )![0]
              : null,
    content:
      input.reference &&
      (await input.fetchReference()).content.trim() !== ""
        ? /(https?:\/\/\S+\.(?:png|mp4|jpg|gif|jpeg)(?:\?[^\s]+)?)/i.test(
            (await input.fetchReference()).content,
          )
          ? null
          : (await input.fetchReference()).content
        : /(https?:\/\/\S+\.(?:png|mp4|jpg|gif|jpeg)(?:\?[^\s]+)?)/i.test(
              pinContentString,
            )
          ? null
          : pinContentString.trim() !== ""
            ? pinContentString.trim()
            : null,
    owner: ctx.user.id,
  };

  if (!pinContent.content && !pinContent.attachment) {
    return ctx.reply({
      content: "",
      embeds: [
        {
          description: "❌ **Please provide the content for the pin**",
          color: client.color,
        },
      ],
    });
  }

  await client.pinsDB.set(
    ctx.guild!.id + args[1].trim().toLowerCase(),
    pinContent,
  );

  return ctx.reply({
    content: "",
    embeds: [
      {
        description: `**Successfully created the pin \`${args[1]}\`**`,
        color: client.color,
      },
    ],
  });
}

async function viewPin(ctx: CommandContext, args: string[], client: Client) {
  const input = commandInput(ctx);
  if (args.length < 1) {
    return ctx.reply({
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

  const pinName = ctx.guild!.id + args[0].trim().toLowerCase();

  const pinContent = await client.pinsDB.get(pinName);

  if (!pinContent) {
    return ctx.reply({
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
    return ctx.reply({
      content: `${pinContent.attachment}`,
    });
  } else {
    return ctx.reply({
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

async function removePin(ctx: CommandContext, args: string[], client: Client) {
  const input = commandInput(ctx);
  if (args.length < 2) {
    return ctx.reply({
      content: "",
      embeds: [
        {
          description:
            "❌ **Please provide the name of the pin you want to remove**",
          color: client.color,
        },
      ],
    });
  }

  const pinName = ctx.guild!.id + args[1].trim().toLowerCase();

  const pinContent = await client.pinsDB.get(pinName);

  if (!pinContent) {
    return ctx.reply({
      content: "",
      embeds: [
        {
          description: `❌ **No pin found with the name \`${args[1]}\`**`,
          color: client.color,
        },
      ],
    });
  }
  if (ctx.user.id !== pinContent.owner) {
    return ctx.reply({
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

  return ctx.reply({
    content: "",
    embeds: [
      {
        description: `✅ **Successfully removed the pin \`${args[1]}\`**`,
        color: client.color,
      },
    ],
  });
}

async function listPin(ctx: CommandContext, args: string[], client: Client) {
  const input = commandInput(ctx);
  const pins = await client.pinsDB.all();

  if (!pins || pins.length === 0) {
    return ctx.reply({
      content: "",
      embeds: [
        {
          description: "❌ **No pins found in the server**",
          color: client.color,
        },
      ],
    });
  }

  let filteredPins = pins.filter((pin) => pin.key.startsWith(ctx.guild!.id));

  if (input.users.size > 0) {
    const mentionedUserId = input.users.first()!.id;
    filteredPins = filteredPins.filter(
      (pin) => pin.value.owner === mentionedUserId,
    );
  }

  const pinList = filteredPins
    .map((pin) => `\`${pin.key.replace(ctx.guild!.id, "")}\``)
    .join(", ");

  return ctx.reply({
    content: "",
    embeds: [
      {
        description: `**List of pins in the server:** \n${pinList}`,
        color: client.color,
      },
    ],
  });
}
