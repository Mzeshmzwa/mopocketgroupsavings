
const mongoose = require('mongoose');

const vaultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0 },
  lockedDeposits: [
    {
      amount: Number,
      lockPeriodInDays: Number,
      startDate: Date,
      endDate: Date,
      status: { type: String, enum: ['locked', 'unlocked', 'withdrawn-early'], default: 'locked' },
      penaltyApplied: { type: Boolean, default: false },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Vault', vaultSchema);
