const mongoose = require('mongoose');

const groupContributionSchema = new mongoose.Schema({
  groupId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'SavingsGroup', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0.01
  },
  currency: {
    type: String,
    default: 'EUR',
    enum: ['EUR', 'SZL']
  },
  contributionType: {
    type: String,
    enum: ['regular', 'bonus', 'penalty_refund'],
    default: 'regular'
  },
  paymentMethod: {
    type: String,
    enum: ['momo', 'bank_transfer', 'cash'],
    default: 'momo'
  },
  momoTransactionId: {
    type: String // ✅ removed sparse from here
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String,
    maxlength: 200
  },
  processedAt: {
    type: Date
  },
  failureReason: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// ✅ Only define index here
groupContributionSchema.index({ groupId: 1, userId: 1 });
groupContributionSchema.index({ status: 1 });
groupContributionSchema.index({ createdAt: -1 });
groupContributionSchema.index({ momoTransactionId: 1 }, { sparse: true });

module.exports = mongoose.model('GroupContribution', groupContributionSchema);
