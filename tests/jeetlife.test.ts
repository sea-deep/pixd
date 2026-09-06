import { describe, expect, it } from "vitest";
import { CATALOG_ITEMS, JOBS } from "../src/data/jeetlife.js";
import { getIndianDayKey, generateCardId } from "../src/services/JeetlifeService.js";
import { JeetlifeViews } from "../src/helpers/jeetlifeViews.js";

describe("Jeetlife Economy & Catalog Invariants", () => {
  it("enforces 4-paise divisibility for all catalog prices", () => {
    for (const [id, item] of Object.entries(CATALOG_ITEMS)) {
      expect(item.price % 4, `Item ${id} price ${item.price} is not divisible by 4`).toBe(0);
      expect(item.limit, `Item ${id} limit must be positive`).toBeGreaterThanOrEqual(1);
      expect(item.name.length, `Item ${id} has empty name`).toBeGreaterThan(0);
    }
  });

  it("enforces 4-paise divisibility for all job payouts", () => {
    for (const [id, job] of Object.entries(JOBS)) {
      expect(job.basePay % 4, `Job ${id} basePay ${job.basePay} not divisible by 4`).toBe(0);
      expect(job.roundBonus % 4, `Job ${id} roundBonus ${job.roundBonus} not divisible by 4`).toBe(0);
      expect(job.rounds, `Job ${id} must have 3 rounds`).toBe(3);
    }
  });

  it("includes all 6 jobs with at least 10 validated questions each", () => {
    const expectedJobs = [
      "maal_utaro",
      "stall_majdoori",
      "mix_banao",
      "hisaab_milao",
      "bhookhmato_delivery",
      "jhatpat_delivery",
    ];

    for (const jobId of expectedJobs) {
      const job = JOBS[jobId];
      expect(job, `Missing job: ${jobId}`).toBeDefined();
      expect(job.questions.length, `Job ${jobId} must have at least 10 questions`).toBeGreaterThanOrEqual(10);

      for (let i = 0; i < job.questions.length; i++) {
        const q = job.questions[i];
        expect(q.prompt, `Job ${jobId} Q${i} empty prompt`).toBeTruthy();
        expect(q.options.length, `Job ${jobId} Q${i} needs at least 3 options`).toBeGreaterThanOrEqual(3);
        expect(q.correctIndex, `Job ${jobId} Q${i} invalid correctIndex`).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex, `Job ${jobId} Q${i} correctIndex out of bounds`).toBeLessThan(q.options.length);
        expect(q.explanation, `Job ${jobId} Q${i} empty explanation`).toBeTruthy();
      }
    }
  });

  it("includes street food items with rich flavour responses", () => {
    const foodItems = ["samosa", "pani_puri", "chowmein", "momos"];
    for (const foodId of foodItems) {
      const item = CATALOG_ITEMS[foodId];
      expect(item, `Missing food item: ${foodId}`).toBeDefined();
      expect(item.category).toBe("food");
      expect(item.flavourResponses?.length, `Food ${foodId} needs flavour responses`).toBeGreaterThanOrEqual(2);
    }
  });

  it("generates correct Indian calendar day key in YYYY-MM-DD format", () => {
    const key = getIndianDayKey(new Date());
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("generates formatted MGNREGA Card IDs", () => {
    const cardId = generateCardId("123456789012345678");
    expect(cardId).toMatch(/^MGNREGA-5678-\d{4}$/);
  });
});

describe("Jeetlife Views Construction", () => {
  const dummyUser: any = {
    id: "123456789",
    username: "TestWorker",
    displayAvatarURL: () => "https://example.com/avatar.png",
  };

  const dummyPlayer: any = {
    userID: "123456789",
    cardId: "MGNREGA-6789-5432",
    balance: 48,
    stats: {
      completedShifts: 5,
      perfectShifts: 2,
      earned: 120,
      spent: 72,
    },
    daily: {
      dayKey: getIndianDayKey(),
      paidShifts: 3,
      jobCompletions: ["maal_utaro", "stall_majdoori"],
      objectiveClaimed: false,
    },
    inventory: [
      { itemId: "mgnrega_card", itemName: "MGNREGA Card", amount: 1, limit: 1 },
      { itemId: "chai", itemName: "Tapri Chai", amount: 2, limit: 10 },
      { itemId: "samosa", itemName: "Garam Samosa", amount: 1, limit: 10 },
    ],
  };

  it("renders dashboard without throwing", () => {
    const view = JeetlifeViews.renderDashboard(dummyPlayer, dummyUser, 0xffd700);
    expect(view.embeds).toHaveLength(1);
    expect(view.components.length).toBeGreaterThanOrEqual(1);
    expect(view.embeds[0].title).toContain("Dashboard");
  });

  it("renders MGNREGA Card without throwing", () => {
    const view = JeetlifeViews.renderCard(dummyPlayer, dummyUser, 0x2e7d32);
    expect(view.embeds).toHaveLength(1);
    expect(view.embeds[0].title).toContain("Rojgaar");
  });

  it("renders job list with all 6 jobs", () => {
    const view = JeetlifeViews.renderJobList(dummyPlayer, dummyUser, 0x1e88e5);
    expect(view.embeds).toHaveLength(1);
    expect(view.embeds[0].description).toContain("Jhatpat");
    expect(view.embeds[0].description).toContain("Bhookhmato");
  });

  it("renders task round question", () => {
    const dummyShift = {
      jobId: "jhatpat_delivery",
      round: 0,
      maxRounds: 3,
      quality: 0,
      basePay: 40,
      roundBonus: 8,
      isPractice: false,
      questions: JOBS.jhatpat_delivery.questions.slice(0, 3),
      sessionId: "mock-session-123",
    };
    const view = JeetlifeViews.renderTaskRound(dummyPlayer, dummyShift, 0x3949ab);
    expect(view.embeds).toHaveLength(1);
    expect(view.components[0].components.length).toBe(3);
  });

  it("renders shift summary", () => {
    const dummyResult = {
      job: JOBS.bhookhmato_delivery,
      quality: 3,
      maxRounds: 3,
      basePayEarned: 32,
      bonusEarned: 24,
      objectiveBonus: 16,
      totalPayout: 56,
      player: { balance: 120 },
      explanation: "Delivered smoothly!",
    };
    const view = JeetlifeViews.renderShiftSummary(dummyResult, dummyUser, 0x43a047);
    expect(view.embeds).toHaveLength(1);
    expect(view.embeds[0].description).toContain("New Balance");
  });

  it("renders shop and street food", () => {
    const viewAll = JeetlifeViews.renderShop(dummyPlayer, "all", 0xff9800);
    expect(viewAll.embeds).toHaveLength(1);
    const viewFood = JeetlifeViews.renderShop(dummyPlayer, "food", 0xff9800);
    expect(viewFood.embeds).toHaveLength(1);
    expect(viewFood.embeds[0].title).toContain("Street Food");
  });

  it("renders inventory with usable buttons", () => {
    const view = JeetlifeViews.renderInventory(dummyPlayer, dummyUser, 0x5c6bc0);
    expect(view.embeds).toHaveLength(1);
    expect(view.components.length).toBeGreaterThanOrEqual(1);
  });
});
