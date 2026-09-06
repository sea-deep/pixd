import mongoose from "mongoose";
import emote from "../../Configs/emote.js";


const itemSchema = new mongoose.Schema({
  itemId: { type: String },
  itemName: { type: String, required: true },
  amount: { type: Number, default: 0 },
  limit: { type: Number, default: 1 },
  icon: { type: String },
});

const userSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  schemaVersion: { type: Number, default: 2 },
  cardId: { type: String, default: null },
  onboardingComplete: { type: Boolean, default: false },
  aadhaarNo: { type: String, default: null },
  panNo: { type: String, default: null },
  dob: { type: String, default: null },
  gender: { type: String, default: "Male" },
  balance: { type: Number, default: 0 },
  inventory: {
    type: [itemSchema],
    default: [
      {
        itemId: "aadhaar_card",
        itemName: "Aadhaar Card",
        amount: 1,
        limit: 1,
        icon: emote.aadhaarCard,
      },
      {
        itemId: "pan_card",
        itemName: "PAN Card",
        amount: 1,
        limit: 1,
        icon: emote.panCard,
      },
      {
        itemId: "mgnrega_card",
        itemName: "MGNREGA Card",
        amount: 1,
        limit: 1,
        icon: emote.mnrega,
      },
    ],
  },
  lastDaily: { type: String, default: "01/01/2001" },
  lastBheekh: { type: Date, default: null },
  daily: {
    dayKey: { type: String, default: "" },
    paidShifts: { type: Number, default: 0 },
    jobCompletions: { type: [String], default: [] },
    objectiveClaimed: { type: Boolean, default: false },
  },
  stats: {
    completedShifts: { type: Number, default: 0 },
    perfectShifts: { type: Number, default: 0 },
    earned: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
  },
  activeShift: {
    type: new mongoose.Schema({
      sessionId: { type: String, default: null },
      jobId: { type: String, default: null },
      round: { type: Number, default: 0 },
      maxRounds: { type: Number, default: 3 },
      quality: { type: Number, default: 0 },
      questions: { type: [mongoose.Schema.Types.Mixed], default: [] },
      usedChai: { type: Boolean, default: false },
      basePay: { type: Number, default: 24 },
      roundBonus: { type: Number, default: 8 },
      expiresAt: { type: Date, default: null },
      isPractice: { type: Boolean, default: false },
      dayKey: { type: String, default: "" },
      channelId: { type: String, default: null },
      messageId: { type: String, default: null },
    }, { _id: false }),
    default: null,
  },
  receipts: {
    type: [
      {
        id: { type: String, required: true },
        type: { type: String, required: true },
        description: { type: String, required: true },
        amountChange: { type: Number, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
  lastFoodOrder: { type: String, default: null },
  revision: { type: Number, default: 0 },
});

export default mongoose.model("User", userSchema);
