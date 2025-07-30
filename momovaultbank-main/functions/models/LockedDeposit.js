const mongoose = require("mongoose");

const LockedDepositSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: Number,
  lockPeriodInDays: Number,
  startDate: Date,
  endDate: Date,
  status: { type: String, default: "locked" }, // "locked", "unlocked", "withdrawn-early"
  penaltyApplied: { type: Boolean, default: false },
}, {
  timestamps: true
});

module.exports = mongoose.model("LockedDeposit", LockedDepositSchema);
