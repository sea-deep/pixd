import { ApplicationCommandOptionType, AttachmentBuilder } from "discord.js";
import HybridCommand from "../../structures/HybridCommand.js";
import { isNsfwQuery } from "../../helpers/nsfwFilter.js";
import { env } from "../../utilities/env.js";
import {
  isChannelNsfwWhitelisted,
  setChannelNsfwWhitelist,
  isServerAdminOrOwner,
} from "../../helpers/genesisWhitelist.js";

export default new HybridCommand({
  name: "genesis",
  slashRoute: "xuv genesis",
  description: "Generate an AI image or manage NSFW channel whitelisting.",
  aliases: ["gen"],
  restrictedGuilds: ["804902112700923954"],
  usage: "<prompt> | whitelist [channel] | unwhitelist [channel]",
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "prompt",
      description: "The image prompt (or 'whitelist' / 'unwhitelist' to manage channel)",
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Channel,
      name: "channel",
      description: "Optional channel to whitelist/unwhitelist (admins/owner only)",
      required: false,
    },
  ],
  execute: async (ctx) => {
    const guildId = ctx.guild?.id || (ctx.raw as any)?.guildId;
    if (guildId === "804902112700923954") {
      return;
    }

    const rawPrompt = ctx.options.getString("prompt", true)!.trim();
    const lowerPrompt = rawPrompt.toLowerCase();

    // 1. Channel Whitelisting Management (Admins / Server Owner only)
    if (
      lowerPrompt === "whitelist" ||
      lowerPrompt.startsWith("whitelist ") ||
      lowerPrompt === "unwhitelist" ||
      lowerPrompt.startsWith("unwhitelist ")
    ) {
      if (!ctx.guild) {
        return ctx.reply({ content: "❌ Channel whitelisting can only be managed inside a server." });
      }
      if (!isServerAdminOrOwner(ctx)) {
        return ctx.reply({ content: "❌ Only server administrators or the server owner can manage the NSFW whitelist." });
      }

      const isUnwhitelist = lowerPrompt.startsWith("unwhitelist");
      const channelOpt = (ctx.options as any).getChannel?.("channel");
      let targetChannelId = channelOpt?.id || ctx.channel?.id || (ctx.raw as any)?.channelId;

      const parts = rawPrompt.split(/\s+/);
      if (parts[1]) {
        const mentionMatch = parts[1].match(/^<#(\d+)>$/) || parts[1].match(/^(\d{17,20})$/);
        if (mentionMatch) {
          targetChannelId = mentionMatch[1];
        }
      }

      if (!targetChannelId) {
        return ctx.reply({ content: "❌ Could not determine channel to whitelist." });
      }

      await setChannelNsfwWhitelist(targetChannelId, !isUnwhitelist, {
        guildId: ctx.guild.id,
        setBy: ctx.user.id,
      });

      if (isUnwhitelist) {
        return ctx.reply({
          embeds: [{
            title: "NSFW Whitelist Removed",
            description: `🗑️ Removed <#${targetChannelId}> from the NSFW whitelist. NSFW prompts will now be blocked here.`,
            color: 0xff6600,
          }],
        });
      }

      return ctx.reply({
        embeds: [{
          title: "Channel Whitelisted for NSFW",
          description: `✅ Successfully whitelisted <#${targetChannelId}> for NSFW generation. NSFW prompts are now allowed in this channel.`,
          color: 0x00cc66,
        }],
      });
    }

    // 2. Determine NSFW Permissions for the Current Channel
    const isNsfwChannel = Boolean((ctx.channel as any)?.nsfw);
    const channelId = ctx.channel?.id || (ctx.raw as any)?.channelId;
    const isWhitelisted = channelId ? await isChannelNsfwWhitelisted(channelId) : false;
    const allowNsfw = isNsfwChannel || isWhitelisted;

    // 3. Build Pollinations API Request
    const apiKey = env.POLLINATIONS_API_KEY;
    const baseUrl = apiKey ? "https://gen.pollinations.ai/image" : "https://image.pollinations.ai/prompt";
    const queryParams = new URLSearchParams();
    if (!allowNsfw) {
      queryParams.set("safe", "nsfw");
    }
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const imageUrl = `${baseUrl}/${encodeURIComponent(rawPrompt)}${queryString}`;

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    try {
      const response = await fetch(imageUrl, {
        headers,
        signal: AbortSignal.timeout(90_000),
      });

      if (!response.ok) {
        // Handle provider-level safety block
        if (response.status === 400 && !allowNsfw) {
          const body = await response.json().catch(() => null);
          const safetyApplied = response.headers.get("x-safety-applied");
          const isSafetyBlocked =
            Boolean(safetyApplied) ||
            body?.error?.message?.includes("wrong with the input data") ||
            body?.error?.type === "safety_error" ||
            body?.error?.message?.includes("NSFW");

          if (isSafetyBlocked) {
            return ctx.reply({
              embeds: [{
                title: "❌ NSFW Content Blocked",
                description:
                  "This prompt was blocked by the safety filter because this is not an NSFW channel.\n\n" +
                  "• You can use an age-restricted (NSFW) channel, or\n" +
                  "• A server administrator or server owner can whitelist this channel using `p!genesis whitelist`.",
                color: 0xff0000,
              }],
            });
          }
        }
        throw new Error(`Image provider returned HTTP ${response.status}.`);
      }

      const image = Buffer.from(await response.arrayBuffer());
      if (image.length === 0) throw new Error("Image provider returned an empty file.");

      const isNsfw = isNsfwQuery(rawPrompt);
      const shouldSpoiler = isNsfw;
      const filename = `${rawPrompt.replace(/[^a-z0-9]+/gi, "_").slice(0, 80) || "genesis"}.jpg`;
      const attachment = new AttachmentBuilder(image, { name: filename });
      if (shouldSpoiler) {
        attachment.setSpoiler(true);
      }

      const embed: { description: string; image?: { url: string } } = {
        description: shouldSpoiler
          ? `>>> Genesisation done!\nHere is your **||${rawPrompt.slice(0, 300)}||**`
          : `>>> Genesisation done!\nHere is your **${rawPrompt.slice(0, 300)}**`,
      };

      if (!shouldSpoiler) {
        embed.image = { url: `attachment://${filename}` };
      }

      return ctx.reply({
        embeds: [embed],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 4,
                label: "DELETE",
                custom_id: `delete-btn:${ctx.user.id}`,
                emoji: { name: "🗑️" },
              },
            ],
          },
        ],
        files: [attachment],
      });
    } catch (error) {
      return ctx.reply({
        embeds: [
          {
            title: "Genesis failed",
            description: error instanceof Error ? error.message : "Unknown image-generation error.",
          },
        ],
      });
    }
  },
});

