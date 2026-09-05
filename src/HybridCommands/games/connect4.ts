import HybridCommand from "../../structures/HybridCommand.js";
import { Message } from "discord.js";

export default new HybridCommand({
  name: "connect4",
  description: "Play connect 4 on discord",
  aliases: ["c4"],
  usage: "connect4 @user1",
  guildOnly: true,
  permissions: {
    bot: [],
    user: [],
  },
  /**
   * @param {Message} message
   */
  options: [{ type: 6, name: "opponent", description: "Play against another user" }],
  execute: async (ctx, client) => {
    const opponent = ctx.options.getUser("opponent");
    const emptyDisk = "<:emptyDisk:1102228471448604823>";
    const redCircle = "🔴";
    const yellowCircle = "🟡";
    let desc = [
      `${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}`,
      `${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}`,
      `${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}`,
      `${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}`,
      `${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}`,
      `${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}${emptyDisk}`,
    ];
    let randBool = Math.random() < 0.5;
    let content =
      !opponent
        ? `${redCircle}<@${ctx.user.id}> **VS** ${yellowCircle}**me**\nYour turn ${redCircle}<@${ctx.user.id}> :`
        : randBool
          ? `${redCircle}<@${ctx.user.id}> **VS** ${yellowCircle}<@${opponent.id}>\nYour turn ${redCircle}<@${ctx.user.id}> :`
          : `${redCircle}<@${opponent.id}> **VS** ${yellowCircle}<@${ctx.user.id}>\nYour turn ${redCircle}<@${opponent.id}> :`;

    return ctx.reply({
      content: content,
      tts: false,
      embeds: [
        {

          title: `🔢 Connect 4`,
          description: desc.join("\n"),
          color: 0xe08e67,
          footer: {
            text: `The first player to connect 4 disks horizontally, vertically, or diagonally wins!`,
          },
          fields: [
            {
              name: "",
              value:
                "-# 1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣\n__Click the buttons to drop__\n-# The highlighted button indicates the last move played.`",
            },
          ],
        },
      ],
      components: [
        {
          type: 1,
          components: [
            {
              style: 2,
              custom_id: `oneC4`,
              disabled: false,
              emoji: {  name: `1️⃣` },
              type: 2,
            },
            {
              style: 2,
              custom_id: `twoC4`,
              disabled: false,
              emoji: {  name: `2️⃣` },
              type: 2,
            },
            {
              style: 2,
              custom_id: `threeC4`,
              disabled: false,
              emoji: {  name: `3️⃣` },
              type: 2,
            },
            {
              style: 2,
              custom_id: `fourC4`,
              disabled: false,
              emoji: {  name: `4️⃣` },
              type: 2,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              style: 2,
              custom_id: `fiveC4`,
              disabled: false,
              emoji: {  name: `5️⃣` },
              type: 2,
            },
            {
              style: 2,
              custom_id: `sixC4`,
              disabled: false,
              emoji: {  name: `6️⃣` },
              type: 2,
            },
            {
              style: 2,
              custom_id: `sevenC4`,
              disabled: false,
              emoji: {  name: `7️⃣` },
              type: 2,
            },
          ],
        },
      ],
    });
  },
});
