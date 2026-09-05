import { env } from "../src/utilities/env.js";

const prefix = env.ENVIRONMENT === "prod" ? "p!" : "d!";
const config = {
  prefix,
  color: 0x0e08e6,
  development: { enabled: false, guildId: "" },
  commands: {
    prefix,
    message_commands: true,
    application_commands: { chat_input: true, user_context: true, message_context: true },
  },
  users: { ownerId: "1258396025354453054", developers: [] as string[] },
  restricted: ["720286639691399218", "1104345879588126811", "887265587854737479"] as string[],
  messages: {
    HELP_DESCRIPTION: "Welcome to PixD. Select a category to explore commands.",
    NOT_BOT_OWNER: "❌ This command is restricted to the bot owner.",
    NOT_BOT_DEVELOPER: "❌ This command is restricted to bot developers.",
    NOT_GUILD_OWNER: "❌ This command is restricted to the server owner.",
    CHANNEL_NOT_NSFW: "❌ This command requires an NSFW channel.",
    MISSING_PERMISSIONS: "❌ You do not have the required permissions.",
    COMPONENT_NOT_PUBLIC: "❌ You cannot use this component.",
    GUILD_COOLDOWN: "⏳ Please wait `%cooldown%s` before using this command again.",
    INTERACTION_ERROR: "❌ An error occurred while executing this interaction.",
  },
  errorChannelId: "",
  music: { maxQueueSize: 100, maxPlaylistSize: 50, maxTrackDurationMs: 4 * 60 * 60 * 1000, inactivityMs: 30_000 },
} as const;
export default config;
