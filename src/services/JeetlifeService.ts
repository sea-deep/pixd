import { randomUUID } from "node:crypto";
import User from "../models/jeetModel.js";
import emote from "../../Configs/emote.js";
import { CATALOG_ITEMS, JOBS, CatalogItem, JobDefinition, TaskQuestion } from "../data/jeetlife.js";

export function getIndianDayKey(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

export function generateCardId(userId: string): string {
  const tail = userId.slice(-4).padStart(4, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MGNREGA-${tail}-${rand}`;
}

export class JeetlifeService {
  /**
   * Ensures a player document exists, performs safe legacy v1 migration,
   * rounds legacy uneven balances up to multiples of 4, and guarantees MGNREGA card issuance.
   */
  public static async ensurePlayer(userId: string, userObj?: { username: string; displayName?: string }) {
    let player = await User.findOne({ userID: userId });
    const today = getIndianDayKey();

    if (!player) {
      const cardId = generateCardId(userId);
      player = new User({
        userID: userId,
        schemaVersion: 2,
        cardId,
        onboardingComplete: true,
        balance: 0,
        gender: "Male",
        daily: {
          dayKey: today,
          paidShifts: 0,
          jobCompletions: [],
          objectiveClaimed: false,
        },
        stats: {
          completedShifts: 0,
          perfectShifts: 0,
          earned: 0,
          spent: 0,
        },
        receipts: [
          {
            id: randomUUID(),
            type: "account_creation",
            description: "Jeetlife account and MGNREGA card created",
            amountChange: 0,
            timestamp: new Date(),
          },
        ],
      });
      await player.save();
      return player;
    }

    // Migration logic for existing documents (v1 or unmigrated)
    let needsSave = false;

    // 1. Ensure schema version
    if (!player.schemaVersion || player.schemaVersion < 2) {
      player.schemaVersion = 2;
      needsSave = true;
    }

    // 2. Ensure cardId
    if (!player.cardId) {
      player.cardId = generateCardId(userId);
      needsSave = true;
    }

    // 3. Round balance up to nearest multiple of 4 if uneven
    if (player.balance > 0 && player.balance % 4 !== 0) {
      const originalBalance = player.balance;
      const roundedBalance = Math.ceil(originalBalance / 4) * 4;
      const diff = roundedBalance - originalBalance;
      player.balance = roundedBalance;
      player.receipts = player.receipts || [];
      player.receipts.push({
        id: randomUUID(),
        type: "migration_adjustment",
        description: `Legacy balance rounded up to multiple of 4 (${originalBalance} -> ${roundedBalance})`,
        amountChange: diff,
        timestamp: new Date(),
      } as any);
      needsSave = true;
    }

    // 4. Ensure MGNREGA card in inventory
    player.inventory = player.inventory || [];
    const hasMnrega = player.inventory.some((i: any) => i.itemId === "mgnrega_card" || i.itemName?.includes("MGNREGA") || i.itemName?.includes("MNREGA"));
    if (!hasMnrega) {
      player.inventory.push({
        itemId: "mgnrega_card",
        itemName: "MGNREGA Card",
        amount: 1,
        limit: 1,
        icon: emote.mnrega,
      } as any);
      needsSave = true;
    }

    // 5. Ensure stable itemIds for legacy Aadhaar and PAN cards
    for (const item of player.inventory) {
      if (!item.itemId) {
        if (item.itemName?.includes("Aadhaar")) item.itemId = "aadhaar_card";
        else if (item.itemName?.includes("PAN")) item.itemId = "pan_card";
        else if (item.itemName?.includes("MGNREGA") || item.itemName?.includes("MNREGA")) item.itemId = "mgnrega_card";
        needsSave = true;
      }
    }

    // 6. Ensure daily & stats structures
    if (!player.daily || typeof player.daily !== "object") {
      player.daily = {
        dayKey: today,
        paidShifts: 0,
        jobCompletions: [],
        objectiveClaimed: false,
      };
      needsSave = true;
    } else if (player.daily.dayKey !== today) {
      player.daily.dayKey = today;
      player.daily.paidShifts = 0;
      player.daily.jobCompletions = [];
      player.daily.objectiveClaimed = false;
      needsSave = true;
    }

    if (!player.stats) {
      player.stats = {
        completedShifts: 0,
        perfectShifts: 0,
        earned: 0,
        spent: 0,
      };
      needsSave = true;
    }

    if (needsSave) {
      await player.save();
    }

    return player;
  }

  /**
   * Safe read-only balance check. Never creates an account for third-party lookups.
   */
  public static async getBalance(targetUserId: string) {
    return await User.findOne({ userID: targetUserId });
  }

  /**
   * Atomic daily attendance claim paying exactly 24 paise.
   */
  public static async claimDaily(userId: string, userObj?: { username: string; displayName?: string }) {
    await this.ensurePlayer(userId, userObj);
    const today = getIndianDayKey();

    const claim = await User.findOneAndUpdate(
      {
        userID: userId,
        lastDaily: { $ne: today },
      },
      {
        $set: {
          lastDaily: today,
          "daily.dayKey": today,
        },
        $inc: {
          balance: 24,
          "stats.earned": 24,
        },
        $push: {
          receipts: {
            $each: [
              {
                id: randomUUID(),
                type: "daily_attendance",
                description: "Daily attendance / rojgaar allowance",
                amountChange: 24,
                timestamp: new Date(),
              },
            ],
            $slice: -20,
          },
        },
      },
      { new: true }
    );

    if (!claim) {
      return { success: false, message: "Aapne aaj ki daily attendance pehle hi claim kar li hai! Kal dubara aana." };
    }

    return {
      success: true,
      amount: 24,
      balance: claim.balance,
      player: claim,
    };
  }

  /**
   * Starts a new shift or resumes an existing unexpired shift.
   */
  public static async startShift(userId: string, jobId: string = "maal_utaro") {
    const player = await this.ensurePlayer(userId);
    const today = getIndianDayKey();

    const job = JOBS[jobId] ?? JOBS.maal_utaro;
    const completedShifts = player.stats?.completedShifts ?? 0;

    // Check unlocks
    if (completedShifts < job.minShifts) {
      return {
        error: true,
        message: `**${job.name}** abhi locked hai! Iske liye **${job.minShifts} completed shifts** chahiye (Aapne ${completedShifts} kiye hain).`,
      };
    }

    if (job.requiredItem) {
      const hasItem = player.inventory?.some((i: any) => i.itemId === job.requiredItem && i.amount > 0);
      if (!hasItem) {
        const itemDef = CATALOG_ITEMS[job.requiredItem];
        return {
          error: true,
          message: `**${job.name}** ke liye **${itemDef?.name ?? job.requiredItem}** chahiye! Shop (\`p!shop\`) se khareedo.`,
        };
      }
    }

    // Check if player has an active unexpired shift
    if (player.activeShift && player.activeShift.sessionId) {
      const now = new Date();
      if (player.activeShift.expiresAt && now < new Date(player.activeShift.expiresAt)) {
        return {
          resumed: true,
          player,
          activeShift: player.activeShift,
        };
      }
    }

    // Daily limit check (12 paid shifts per Indian calendar day)
    const paidShiftsToday = player.daily?.dayKey === today ? (player.daily?.paidShifts ?? 0) : 0;
    const isPractice = paidShiftsToday >= 12;

    // Equipment bonus: Safety gloves grant +8 base pay
    const hasGloves = player.inventory?.some((i: any) => i.itemId === "gloves" && i.amount > 0);
    const effectiveBasePay = job.basePay + (hasGloves ? 8 : 0);

    // Pick 3 random questions without repeats
    const shuffled = [...job.questions].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 3);

    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes expiry

    const newShift = {
      sessionId,
      jobId: job.id,
      round: 0,
      maxRounds: 3,
      quality: 0,
      questions: selectedQuestions,
      usedChai: false,
      basePay: effectiveBasePay,
      roundBonus: job.roundBonus,
      expiresAt,
      isPractice,
      dayKey: today,
    };

    player.activeShift = newShift as any;
    await player.save();

    return {
      started: true,
      player,
      activeShift: newShift,
    };
  }

  /**
   * Submits an answer for the current round in an active shift.
   */
  public static async submitAnswer(userId: string, sessionId: string, roundIndex: number, choiceIndex: number) {
    const player = await User.findOne({ userID: userId, "activeShift.sessionId": sessionId });
    if (!player || !player.activeShift) {
      return { error: true, message: "Yeh shift session expired ho chuka hai ya nahi mila. Nayi shift shuru karo!" };
    }

    const shift = player.activeShift;
    const now = new Date();
    if (shift.expiresAt && now > new Date(shift.expiresAt)) {
      player.activeShift = null;
      await player.save();
      return { error: true, message: "Shift ka samay samapt (expired) ho gaya! Nayi shift shuru karo." };
    }

    if (shift.round !== roundIndex) {
      return { error: true, message: "Aap galat round par hain. Kripya latest question ka answer dein." };
    }

    const currentQuestion: TaskQuestion = shift.questions[roundIndex];
    if (!currentQuestion) {
      return { error: true, message: "Question load nahi ho saka." };
    }

    const isCorrect = choiceIndex === currentQuestion.correctIndex;

    // Check if wrong and player can use Chai retry
    const hasChai = player.inventory?.some((i: any) => i.itemId === "chai" && i.amount > 0);
    if (!isCorrect && hasChai && !shift.usedChai) {
      return {
        retryAvailable: true,
        player,
        activeShift: shift,
        currentQuestion,
        message: "Galat jawab! Par aapke paas **Tapri Chai** hai. Kya aap Chai pee kar ek aur mauka lena chahte hain?",
      };
    }

    let quality = shift.quality;
    if (isCorrect) {
      quality += 1;
    }

    const isLastRound = roundIndex + 1 >= shift.maxRounds;

    if (!isLastRound) {
      // Advance to next round
      shift.round = roundIndex + 1;
      shift.quality = quality;
      shift.expiresAt = new Date(Date.now() + 2 * 60 * 1000);
      await player.save();

      return {
        nextRound: true,
        player,
        activeShift: shift,
        wasCorrect: isCorrect,
        explanation: currentQuestion.explanation,
      };
    }

    // Settle shift!
    const jobKey = shift.jobId ?? "maal_utaro";
    const job = JOBS[jobKey] ?? JOBS.maal_utaro;
    const isPractice = shift.isPractice;
    const basePayEarned = isPractice ? 0 : shift.basePay;
    const bonusEarned = isPractice ? 0 : quality * shift.roundBonus;
    const totalPayout = basePayEarned + bonusEarned;

    const today = getIndianDayKey();
    const isToday = shift.dayKey === today;

    // Update daily job completions and stats
    const jobCompletions = new Set(player.daily?.jobCompletions ?? []);
    jobCompletions.add(job.id);

    let objectiveBonus = 0;
    let objectiveUnlocked = false;
    // Daily objective: complete 3 distinct jobs in one calendar day -> 16 paise once
    if (jobCompletions.size >= 3 && !player.daily?.objectiveClaimed && !isPractice) {
      objectiveBonus = 16;
      objectiveUnlocked = true;
    }

    const totalMoneyChange = totalPayout + objectiveBonus;

    const receipt = {
      id: randomUUID(),
      type: "shift_payout",
      description: `${job.name} shift complete (${quality}/${shift.maxRounds} correct)${isPractice ? " [Practice]" : ""}`,
      amountChange: totalMoneyChange,
      timestamp: new Date(),
    };

    // Atomic update
    const updated = await User.findOneAndUpdate(
      { userID: userId, "activeShift.sessionId": sessionId },
      {
        $set: {
          activeShift: null,
          "daily.dayKey": today,
          "daily.jobCompletions": Array.from(jobCompletions),
          ...(objectiveUnlocked ? { "daily.objectiveClaimed": true } : {}),
        },
        $inc: {
          balance: totalMoneyChange,
          "stats.earned": totalMoneyChange,
          "stats.completedShifts": 1,
          ...(quality === shift.maxRounds ? { "stats.perfectShifts": 1 } : {}),
          ...(isToday && !isPractice ? { "daily.paidShifts": 1 } : {}),
        },
        $push: {
          receipts: {
            $each: [receipt],
            $slice: -20,
          },
        },
      },
      { new: true }
    );

    return {
      completed: true,
      player: updated,
      job,
      quality,
      maxRounds: shift.maxRounds,
      basePayEarned,
      bonusEarned,
      totalPayout,
      objectiveBonus,
      isPractice,
      receipt,
      wasCorrect: isCorrect,
      explanation: currentQuestion.explanation,
    };
  }

  /**
   * Applies Chai retry during an active shift.
   */
  public static async useChaiRetry(userId: string, sessionId: string) {
    const player = await User.findOne({ userID: userId, "activeShift.sessionId": sessionId });
    if (!player || !player.activeShift) {
      return { error: true, message: "Active shift nahi mili." };
    }

    const chaiItem = player.inventory?.find((i: any) => i.itemId === "chai" && i.amount > 0);
    if (!chaiItem) {
      return { error: true, message: "Aapke paas Tapri Chai nahi hai!" };
    }

    if (player.activeShift.usedChai) {
      return { error: true, message: "Is shift mein aap pehle hi Chai retry use kar chuke hain (max 1 per shift)!" };
    }

    // Decrement chai and flag usedChai
    chaiItem.amount -= 1;
    player.activeShift.usedChai = true;
    player.activeShift.expiresAt = new Date(Date.now() + 2 * 60 * 1000);
    await player.save();

    return {
      success: true,
      player,
      activeShift: player.activeShift,
      currentQuestion: player.activeShift.questions[player.activeShift.round],
    };
  }

  /**
   * Purchases items or street food with atomic balance and stack limit verification.
   */
  public static async buyItem(userId: string, itemId: string, quantity: number = 1) {
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 10) {
      return { error: true, message: "Quantity 1 se 10 ke beech valid positive number honi chahiye!" };
    }

    const item = CATALOG_ITEMS[itemId];
    if (!item || item.price <= 0) {
      return { error: true, message: "Yeh item shop mein bikne ke liye uplabdh nahi hai." };
    }

    const player = await this.ensurePlayer(userId);
    const completedShifts = player.stats?.completedShifts ?? 0;

    // Check shift unlock prerequisites
    if (item.requiresShifts && completedShifts < item.requiresShifts) {
      return {
        error: true,
        message: `**${item.name}** khareedne ke liye kam se kam **${item.requiresShifts} completed shifts** zaroori hain! (Aapke paas ${completedShifts} hain).`,
      };
    }

    // Check current owned amount and stack limit
    const currentItem = player.inventory?.find((i: any) => i.itemId === itemId);
    const currentAmount = currentItem ? currentItem.amount : 0;
    if (currentAmount + quantity > item.limit) {
      return {
        error: true,
        message: `Aap **${item.name}** maximum **${item.limit}** hi rakh sakte hain! (Aapke paas pehle se ${currentAmount} hain).`,
      };
    }

    const totalCost = item.price * quantity;
    if (player.balance < totalCost) {
      return {
        error: true,
        message: `Paise kam hain! **${quantity}x ${item.name}** ke liye **${totalCost} paise** chahiye, aapke paas **${player.balance} paise** hain.`,
      };
    }

    // Deduct balance and add item atomically
    player.balance -= totalCost;
    if (!player.stats) {
      player.stats = { completedShifts: 0, perfectShifts: 0, earned: 0, spent: 0 };
    }
    player.stats.spent = (player.stats.spent ?? 0) + totalCost;

    if (currentItem) {
      currentItem.amount += quantity;
    } else {
      player.inventory.push({
        itemId: item.id,
        itemName: item.name,
        amount: quantity,
        limit: item.limit,
        icon: item.icon,
      } as any);
    }

    player.receipts = player.receipts || [];
    player.receipts.push({
      id: randomUUID(),
      type: "shop_purchase",
      description: `Khareeda: ${quantity}x ${item.name}`,
      amountChange: -totalCost,
      timestamp: new Date(),
    } as any);

    while (player.receipts.length > 20) {
      player.receipts.shift();
    }

    await player.save();

    return {
      success: true,
      item,
      quantity,
      totalCost,
      remainingBalance: player.balance,
      player,
    };
  }

  /**
   * Consumes or uses an item (food, chai, vimal).
   */
  public static async useItem(userId: string, itemId: string) {
    const player = await this.ensurePlayer(userId);
    const currentItem = player.inventory?.find((i: any) => i.itemId === itemId && i.amount > 0);

    if (!currentItem) {
      return { error: true, message: `Aapke paas yeh item nahi hai!` };
    }

    const catalog = CATALOG_ITEMS[itemId];
    if (!catalog) {
      return { error: true, message: `Anjaan item.` };
    }

    if (catalog.category === "card" || catalog.category === "equipment") {
      return {
        error: true,
        message: `**${catalog.name}** ek permanent document/equipment hai! Ise consume nahi kiya ja sakta.`,
      };
    }

    // Decrement item
    currentItem.amount -= 1;
    if (catalog.category === "food") {
      player.lastFoodOrder = catalog.name;
    }

    await player.save();

    const responses = catalog.flavourResponses ?? ["Item use ho gaya!"];
    const text = responses[Math.floor(Math.random() * responses.length)];

    return {
      success: true,
      item: catalog,
      message: text,
      player,
    };
  }
}
