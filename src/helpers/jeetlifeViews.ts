import type { User as DiscordUser } from "discord.js";
import emote from "../../Configs/emote.js";
import { CATALOG_ITEMS, JOBS, JobDefinition, CatalogItem } from "../data/jeetlife.js";
import { getIndianDayKey } from "../services/JeetlifeService.js";

export class JeetlifeViews {
  /**
   * Main dashboard view with MGNREGA Card summary, balance, daily progress, and actions.
   */
  public static renderDashboard(player: any, user: DiscordUser, clientColor: number = 0xffd700) {
    const today = getIndianDayKey();
    const paidToday = player.daily?.dayKey === today ? (player.daily?.paidShifts ?? 0) : 0;
    const completedShifts = player.stats?.completedShifts ?? 0;
    const isPractice = paidToday >= 12;

    const completedJobsToday = new Set(player.daily?.dayKey === today ? (player.daily?.jobCompletions ?? []) : []);
    const objectiveDone = Boolean(player.daily?.objectiveClaimed);
    const objectiveProgress = `${Math.min(3, completedJobsToday.size)}/3`;

    let activeShiftNotice = "";
    if (player.activeShift && player.activeShift.sessionId) {
      const now = new Date();
      if (player.activeShift.expiresAt && now < new Date(player.activeShift.expiresAt)) {
        const job = JOBS[player.activeShift.jobId] ?? JOBS.maal_utaro;
        activeShiftNotice = `\n⚠️ **Active Shift Pending:** ${job.name} (Round ${player.activeShift.round + 1}/3). Resume with **Majdoori**!`;
      }
    }

    const embed = {
      title: `🇮🇳 Jeetlife Dashboard — ${user.username}`,
      description: `**MGNREGA Card:** \`${player.cardId ?? "MGNREGA-0000-0000"}\`\n**Pocket Balance:** \`${player.balance}\` ${emote.paise}\n${activeShiftNotice}`,
      color: clientColor,
      fields: [
        {
          name: "👷 Shift Attendance",
          value: `• Completed Shifts: **${completedShifts}**\n• Today's Paid Shifts: **${paidToday}/12** ${isPractice ? "*(Practice Mode Active)*" : ""}`,
          inline: true,
        },
        {
          name: "🎯 Daily Board Objective",
          value: `Complete 3 distinct jobs today:\nProgress: **${objectiveProgress}** ${objectiveDone ? "✅ *(+16 paise claimed!)*" : "*(Earns +16 paise)*"}`,
          inline: true,
        },
        {
          name: "🍲 Street Food Corner",
          value: player.lastFoodOrder ? `Last ate: **${player.lastFoodOrder}**` : "Abhi tak kuch nahi khaya. Tapri ya Stall se samosa-chai lo!",
          inline: false,
        },
      ],
      thumbnail: { url: user.displayAvatarURL() },
      footer: { text: "Jeetlife • Har 4 paise se banti hai nayi pehchan" },
    };

    const components = [
      {
        type: 1,
        components: [
          { type: 2, style: 1, custom_id: "jeet:jobs", label: "Majdoori (Work)", emoji: { name: "🔨" } },
          { type: 2, style: 2, custom_id: "jeet:shop:all", label: "Shop", emoji: { name: "🛒" } },
          { type: 2, style: 2, custom_id: "jeet:shop:food", label: "Street Food", emoji: { name: "🥟" } },
          { type: 2, style: 2, custom_id: "jeet:inv", label: "Inventory", emoji: { name: "🎒" } },
          { type: 2, style: 3, custom_id: "jeet:daily", label: "Daily Attendance", emoji: { name: "📅" } },
        ],
      },
      {
        type: 1,
        components: [
          { type: 2, style: 2, custom_id: "jeet:card", label: "View MGNREGA Card", emoji: { name: "🪪" } },
        ],
      },
    ];

    return { embeds: [embed], components };
  }

  /**
   * Government MGNREGA Card view.
   */
  public static renderCard(player: any, user: DiscordUser, clientColor: number = 0x2e7d32) {
    const completedShifts = player.stats?.completedShifts ?? 0;
    const earned = player.stats?.earned ?? 0;

    const embed = {
      title: "📜 Rashtriya Gramin Rojgaar Guarantee Card",
      description: `**Govt. of India • National Rural Employment Guarantee Scheme**\n\n` +
        `**Cardholder Name:** \`${user.username}\`\n` +
        `**Card Number:** \`${player.cardId ?? "MGNREGA-0000-0000"}\`\n` +
        `**Category:** \`${player.gender ?? "Male"}\`\n` +
        `**Attendance Recorded:** \`${completedShifts} Shifts\`\n` +
        `**Lifetime Allowance:** \`${earned}\` ${emote.paise}\n` +
        `**Current Balance:** \`${player.balance}\` ${emote.paise}\n` +
        `**Linked Documents:** Aadhaar (${player.aadhaarNo ? "Verified" : "Linked"}), PAN (${player.panNo ? "Registered" : "Linked"})`,
      color: clientColor,
      thumbnail: { url: user.displayAvatarURL() },
      footer: { text: "MGNREGA • Kaam ka adhikaar, jeevan ka aadhar" },
    };

    const components = [
      {
        type: 1,
        components: [
          { type: 2, style: 1, custom_id: "jeet:jobs", label: "Shifts Dekho (Work)", emoji: { name: "🔨" } },
          { type: 2, style: 2, custom_id: "jeet:dash", label: "Back to Dashboard", emoji: { name: "🏠" } },
        ],
      },
    ];

    return { embeds: [embed], components };
  }

  /**
   * Available Jobs list (Traditional Site Work + Modern Gig Work).
   */
  public static renderJobList(player: any, user: DiscordUser, clientColor: number = 0x1e88e5) {
    const completedShifts = player.stats?.completedShifts ?? 0;
    const hasCycle = player.inventory?.some((i: any) => i.itemId === "cycle" && i.amount > 0);

    const jobEntries = Object.values(JOBS).map((job) => {
      const unlocked = completedShifts >= job.minShifts && (!job.requiredItem || (job.requiredItem === "cycle" && hasCycle));
      let status = "✅ Available";
      if (!unlocked) {
        if (completedShifts < job.minShifts) status = `🔒 Unlocks at ${job.minShifts} shifts`;
        else if (job.requiredItem === "cycle" && !hasCycle) status = "🔒 Requires Cycle (Shop)";
      }

      const categoryEmoji = job.category === "gig" ? "🛵" : job.category === "stall" ? "☕" : "🏗️";
      return `**${categoryEmoji} ${job.name}** [${status}]\n-# ${job.tagline} • Base: \`${job.basePay}\` + \`${job.roundBonus}\`/round`;
    }).join("\n\n");

    const embed = {
      title: "👷 Available Majdoori & Modern Gig Shifts",
      description: `${jobEntries}\n\n*Choose a shift to start working:*`,
      color: clientColor,
      footer: { text: "Select a job to start a 3-round work shift" },
    };

    // Action buttons for unlocked jobs (up to 5 per row)
    const row1: any[] = [];
    const row2: any[] = [];

    for (const job of Object.values(JOBS)) {
      const unlocked = completedShifts >= job.minShifts && (!job.requiredItem || (job.requiredItem === "cycle" && hasCycle));
      const btn = {
        type: 2,
        style: unlocked ? 1 : 2,
        custom_id: `jeet:work:${job.id}`,
        label: job.name,
        disabled: !unlocked,
      };
      if (row1.length < 3) row1.push(btn);
      else if (row2.length < 3) row2.push(btn);
    }

    const backBtn = { type: 2, style: 2, custom_id: "jeet:dash", label: "Dashboard", emoji: { name: "🏠" } };
    if (row2.length < 5) row2.push(backBtn);
    else row1.push(backBtn);

    const components = [
      { type: 1, components: row1 },
      ...(row2.length > 0 ? [{ type: 1, components: row2 }] : []),
    ];

    return { embeds: [embed], components };
  }

  /**
   * Question view for a specific round of an active shift.
   */
  public static renderTaskRound(player: any, shift: any, clientColor: number = 0x3949ab) {
    const job: JobDefinition = JOBS[shift.jobId] ?? JOBS.maal_utaro;
    const question = shift.questions[shift.round];

    const currentPotential = shift.isPractice ? 0 : shift.basePay + (shift.quality * shift.roundBonus);

    const embed = {
      title: `${job.category === "gig" ? "🛵" : job.category === "stall" ? "☕" : "🏗️"} ${job.name} — Round ${shift.round + 1} of ${shift.maxRounds}`,
      description: `**Shift Instruction:**\n${question.prompt}\n\n` +
        `• Current Score: **${shift.quality}/${shift.round} correct**\n` +
        `• Earned so far: **${currentPotential}** ${emote.paise}${shift.isPractice ? " *(Practice Mode)*" : ""}\n` +
        `• Round Reward: **+${shift.roundBonus}** ${emote.paise}`,
      color: clientColor,
      footer: { text: "Tap the correct answer below within 2 minutes" },
    };

    const answerButtons = question.options.map((opt: string, idx: number) => ({
      type: 2,
      style: 2,
      custom_id: `jeet:ans:${shift.sessionId}:${shift.round}:${idx}`,
      label: opt.length > 80 ? opt.slice(0, 77) + "..." : opt,
    }));

    const components = [
      { type: 1, components: answerButtons },
    ];

    return { embeds: [embed], components };
  }

  /**
   * Shift settlement view.
   */
  public static renderShiftSummary(result: any, user: DiscordUser, clientColor: number = 0x43a047) {
    const isPerfect = result.quality === result.maxRounds;

    const embed = {
      title: `${isPerfect ? "🌟" : "✅"} Shift Samapt: ${result.job.name}`,
      description: `**Result:** ${result.quality}/${result.maxRounds} correct answers!\n\n` +
        `• Base Pay: \`${result.basePayEarned}\` ${emote.paise}\n` +
        `• Quality Bonus: \`+${result.bonusEarned}\` ${emote.paise} (${result.quality} x ${result.job.roundBonus})\n` +
        (result.objectiveBonus > 0 ? `• 🎯 Daily Objective Bonus: \`+${result.objectiveBonus}\` ${emote.paise}\n` : "") +
        `• **Total Payout:** \`${result.totalPayout + result.objectiveBonus}\` ${emote.paise}\n` +
        `• **New Balance:** \`${result.player.balance}\` ${emote.paise}\n\n` +
        `*${result.explanation}*`,
      color: clientColor,
      footer: { text: "Attendance lag gayi! Paise wallet mein jama ho gaye." },
    };

    const components = [
      {
        type: 1,
        components: [
          { type: 2, style: 1, custom_id: `jeet:work:${result.job.id}`, label: "Work Again", emoji: { name: "🔁" } },
          { type: 2, style: 2, custom_id: "jeet:jobs", label: "Change Job", emoji: { name: "🔨" } },
          { type: 2, style: 2, custom_id: "jeet:shop:all", label: "Shop", emoji: { name: "🛒" } },
          { type: 2, style: 2, custom_id: "jeet:dash", label: "Dashboard", emoji: { name: "🏠" } },
        ],
      },
    ];

    return { embeds: [embed], components };
  }

  /**
   * Shop and Street Food catalog view.
   */
  public static renderShop(player: any, category: string = "all", clientColor: number = 0xff9800) {
    const isFoodOnly = category === "food";
    const items = Object.values(CATALOG_ITEMS).filter((i) => {
      if (isFoodOnly) return i.category === "food";
      return i.price > 0; // Filter out free identity cards
    });

    const list = items.map((item) => {
      const owned = player.inventory?.find((i: any) => i.itemId === item.id)?.amount ?? 0;
      const req = item.requiresShifts ? ` (Requires ${item.requiresShifts} shifts)` : "";
      return `**${item.icon} ${item.name}** — \`${item.price}\` ${emote.paise} [Owned: ${owned}/${item.limit}]${req}\n-# ${item.description}`;
    }).join("\n\n");

    const embed = {
      title: isFoodOnly ? "🥟 Tapri & Street Food Corner" : "🛒 Jeetlife Bazaari (Shop)",
      description: `**Your Balance:** \`${player.balance}\` ${emote.paise}\n\n${list}`,
      color: clientColor,
      footer: { text: "Click an item below to buy 1 unit or use /buy <item> <quantity>" },
    };

    // Quick buy buttons for top 4 items in category
    const buyButtons = items.slice(0, 4).map((item) => ({
      type: 2,
      style: 2,
      custom_id: `jeet:buy:${item.id}:1`,
      label: `Buy ${item.name}`,
      emoji: { name: item.icon.startsWith("<") ? undefined : item.icon },
      disabled: player.balance < item.price,
    }));

    const navRow = [
      { type: 2, style: isFoodOnly ? 2 : 1, custom_id: "jeet:shop:all", label: "All Items", emoji: { name: "🛒" } },
      { type: 2, style: isFoodOnly ? 1 : 2, custom_id: "jeet:shop:food", label: "Street Food", emoji: { name: "🥟" } },
      { type: 2, style: 2, custom_id: "jeet:inv", label: "Inventory", emoji: { name: "🎒" } },
      { type: 2, style: 2, custom_id: "jeet:dash", label: "Dashboard", emoji: { name: "🏠" } },
    ];

    const components = [
      ...(buyButtons.length > 0 ? [{ type: 1, components: buyButtons }] : []),
      { type: 1, components: navRow },
    ];

    return { embeds: [embed], components };
  }

  /**
   * Player Inventory View.
   */
  public static renderInventory(player: any, user: DiscordUser, clientColor: number = 0x5c6bc0) {
    const inv = player.inventory || [];
    const itemsList = inv.map((item: any, idx: number) => {
      const def = CATALOG_ITEMS[item.itemId];
      const usable = def?.category === "food" || def?.category === "consumable";
      return `**${idx + 1}. ${item.icon ?? def?.icon ?? "📦"} ${item.itemName}** \`x${item.amount}\` ${usable ? "*(Usable)*" : "*(Document/Gear)*"}\n-# ${def?.description ?? "Inventory item"}`;
    }).join("\n\n") || "Aapka jhola (inventory) abhi khali hai.";

    const embed = {
      title: `🎒 ${user.username}'s Jhola (Inventory)`,
      description: `**Balance:** \`${player.balance}\` ${emote.paise}\n\n${itemsList}`,
      color: clientColor,
      footer: { text: "Use items directly or via /use <item>" },
    };

    // Use buttons for usable items currently owned
    const usableButtons: any[] = [];
    for (const item of inv) {
      const def = CATALOG_ITEMS[item.itemId];
      if ((def?.category === "food" || def?.category === "consumable") && item.amount > 0 && usableButtons.length < 3) {
        usableButtons.push({
          type: 2,
          style: 1,
          custom_id: `jeet:use:${item.itemId}`,
          label: `Use ${item.itemName}`,
          emoji: { name: def.icon.startsWith("<") ? undefined : def.icon },
        });
      }
    }

    const navRow = [
      { type: 2, style: 2, custom_id: "jeet:shop:all", label: "Shop", emoji: { name: "🛒" } },
      { type: 2, style: 2, custom_id: "jeet:jobs", label: "Majdoori", emoji: { name: "🔨" } },
      { type: 2, style: 2, custom_id: "jeet:dash", label: "Dashboard", emoji: { name: "🏠" } },
    ];

    const components = [
      ...(usableButtons.length > 0 ? [{ type: 1, components: usableButtons }] : []),
      { type: 1, components: navRow },
    ];

    return { embeds: [embed], components };
  }
}
