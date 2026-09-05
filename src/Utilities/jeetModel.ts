import mongoose from "mongoose";
import emote from "../Configs/emote.js";

const itemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  amount: { type: Number, default: 0 },
  limit: { type: Number, default: 1 },
  icon: { type: String },
});

const userSchema = new mongoose.Schema({
  userID: { type: String, required: true, unique: true },
  aadhaarNo: { type: String, default: null },
  panNo: { type: String, default: null },
  dob: { type: String, default: null },
  gender: { type: String, default: "Male" },
  balance: { type: Number, default: 0 },
  inventory: {
    type: [itemSchema], default: [
      {
        itemName: "Aadhaar Card",
        amount: 1,
        icon: emote.aadhaarCard,
      },
      {
        itemName: "PAN Card",
        amount: 1,
        icon: emote.panCard,
      }
    ],
  },
  lastDaily: { type: String, default: "01/01/2001" },
  lastBheekh: { type: Date, default: null },

});

export default mongoose.model("User", userSchema);
