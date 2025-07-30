
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'penalty'], required: true },
  amount: { type: Number, required: true },
  lockPeriodInDays: Number,
  penaltyFee: Number,
  momoTransactionId: String,
  relatedLockedDepositIndex: { type: mongoose.Schema.Types.Mixed }, // Can be Number (old) or ObjectId (new)
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', transactionSchema);
