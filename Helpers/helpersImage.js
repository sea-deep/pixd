const regex = /https?:\/\/.*\.(?:png|jpg|jpeg|gif)/i;
const emoteRegex = /<:[^:]+:(\d+)>/;

export async function getInputImage(message, opt) {
  let state = opt?.dynamic ? false : true;

  if (message.attachments.size >= 1) {
    return message.attachments.first().url;
  }

  if (message.stickers.size >= 1) {
    return `https://cdn.discordapp.com/stickers/${
      message.stickers.first().id
    }.png`;
  }

  let match = message.content.match(emoteRegex);
  if (match) {
    let emojiId = match[1];
    return `https://cdn.discordapp.com/emojis/${emojiId}.png`;
  }

  match = message.content.match(regex);
  if (match) {
    return match[0];
  }

  if (message.reference) {
    let refMsg = await message.channel.messages.fetch(
      message.reference.messageId,
    );

    if (refMsg.attachments.size >= 1) {
      return refMsg.attachments.first().url;
    }

    match = refMsg.content.match(regex);
    if (match) {
      return match[0];
    }

    match = refMsg.content.match(emoteRegex);
    if (match) {
      let emojiId = match[1];
      return `https://cdn.discordapp.com/emojis/${emojiId}.png`;
    }

    if (refMsg.stickers.size >= 1) {
      return `https://cdn.discordapp.com/stickers/${
        refMsg.stickers.first().id
      }.png`;
    }
  }

  if (message.mentions.users.size >= 1) {
    return message.mentions.users.first().displayAvatarURL({
      extension: "png",
      forceStatic: state,
    });
  }

  return message.member.user.displayAvatarURL({
    extension: "png",
    forceStatic: state,
  });
}

export async function getCaptionInput(message) {
  let image = null;

  // Check referenced message
  if (message.reference) {
    const refMsg = await message.channel.messages.fetch(
      message.reference.messageId,
    );

    if (refMsg.attachments.size >= 1) {
      image = refMsg.attachments.first().url;
    } else {
      let match = refMsg.content.match(regex);
      if (match) {
        image = match[0];
      } else {
        match = refMsg.content.match(emoteRegex);
        if (match) {
          const emojiId = match[1];
          image = `https://cdn.discordapp.com/emojis/${emojiId}.png`;
        }
      }
    }

    // Return if image is found in the referenced message
    if (image) {
      return image;
    }
  }

  // Check current message
  if (message.attachments.size >= 1) {
    image = message.attachments.first().url;
  } else if (message.stickers.size >= 1) {
    image = `https://cdn.discordapp.com/stickers/${message.stickers.first().id}.png`;
  } else {
    let match = message.content.match(regex);
    if (match) {
      image = match[0];
    } else {
      match = message.content.match(emoteRegex);
      if (match) {
        const emojiId = match[1];
        image = `https://cdn.discordapp.com/emojis/${emojiId}.png`;
      }
    }
  }

  // If image still not found, check recent messages
  if (!image) {
    const messages = await message.channel.messages.fetch({
      limit: 10,
      cache: false,
    });
    messages.forEach((msg) => {
      if (!image) {
        if (msg.attachments.size >= 1) {
          image = msg.attachments.first().url;
        } else if (msg.stickers.size >= 1) {
          image = `https://cdn.discordapp.com/stickers/${msg.stickers.first().id}.png`;
        } else {
          const match = msg.content.match(
            regex,
          );
          if (match) {
            image = match[0];
          } else {
            const emojiMatch = msg.content.match(emoteRegex);
            if (emojiMatch) {
              const emojiId = emojiMatch[1];
              image = `https://cdn.discordapp.com/emojis/${emojiId}.png`;
            }
          }
        }
      }
    });
  }

  return image;
}

export async function getInputImageInt(interaction) {
  const opt = interaction.options._hoistedOptions;
  if (opt && opt.length !== 0) {
    switch (opt[0].name) {
      case "user":
        return opt[0].user.displayAvatarURL({
          forceStatic: true,
          extension: "png",
        });
      case "image-url":
        return interaction.options.getString("image-url");
      case "image-file":
        return opt[0].attachment.url;
      default:
        break;
    }
  }
  return interaction.user.displayAvatarURL({
    forceStatic: true,
    extension: "png",
  });
}

export async function getCaptionInputInt(interaction) {
  const opt = interaction.options._hoistedOptions;
  if (opt.length > 1) {
    switch (opt[1].name) {
      case "image-url":
        return opt[1].value.match(
          regex
        )[0];
      case "image-file":
        return opt[1].attachment.url;
      default:
        break;
    }
  }
  let image;
  const messages = await interaction.channel.messages.fetch({
    limit: 50,
    cache: false,
  });
  messages.forEach((msg) => {
    if (!image) {
      if (msg.attachments.size >= 1) {
        image = msg.attachments.first().url;
      } else if (msg.stickers.size >= 1) {
        image = `https://cdn.discordapp.com/stickers/${msg.stickers.first().id}.png`;
      } else {
        const match = msg.content.match(regex);
        if (match) {
          image = match[0];
        }
      }
    }
  });
  return image;
}
