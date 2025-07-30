const mongoose = require('mongoose');

const savingsGroupSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 500
  },
  targetAmount: { 
    type: Number, 
    required: true,
    min: 1
  },
  currentAmount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'EUR',
    enum: ['EUR', 'SZL']
  },
  maxMembers: { 
    type: Number, 
    required: true,
    min: 2,
    max: 100
  },
  currentMembers: { 
    type: Number, 
    default: 0,
    min: 0
  },
  minimumContribution: {
    type: Number,
    required: true,
    min: 1
  },
  contributionFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  startDate: { 
    type: Date, 
    required: true
  },
  endDate: { 
    type: Date, 
    required: true
  },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'cancelled', 'draft'], 
    default: 'draft'
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  members: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    joinedAt: { 
      type: Date, 
      default: Date.now 
    },
    totalContributed: { 
      type: Number, 
      default: 0,
      min: 0
    },
    lastContribution: { 
      type: Date 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  }],
  rules: {
    allowEarlyWithdrawal: { 
      type: Boolean, 
      default: false 
    },
    penaltyPercentage: { 
      type: Number, 
      default: 10,
      min: 0,
      max: 50
    },
    requiresApproval: { 
      type: Boolean, 
      default: true 
    }
  },
  isPublic: { 
    type: Boolean, 
    default: true 
  },
  inviteCode: { 
    type: String, 
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
savingsGroupSchema.index({ status: 1, isPublic: 1 });
savingsGroupSchema.index({ createdBy: 1 });
savingsGroupSchema.index({ 'members.userId': 1 });
savingsGroupSchema.index({ inviteCode: 1 });

// Virtual for progress percentage
savingsGroupSchema.virtual('progressPercentage').get(function() {
  return this.targetAmount > 0 ? Math.round((this.currentAmount / this.targetAmount) * 100) : 0;
});

// Virtual for days remaining
savingsGroupSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const timeDiff = this.endDate - now;
  return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
});

// Pre-save middleware to generate invite code
savingsGroupSchema.pre('save', function(next) {
  if (this.isNew && !this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

// Method to add member
savingsGroupSchema.methods.addMember = function(userId) {
  const existingMember = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (existingMember) {
    throw new Error('User is already a member of this group');
  }
  
  if (this.currentMembers >= this.maxMembers) {
    throw new Error('Group has reached maximum member limit');
  }
  
  this.members.push({ userId });
  this.currentMembers = this.members.filter(m => m.isActive).length;
  
  return this.save();
};

// Method to remove member
savingsGroupSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (memberIndex === -1) {
    throw new Error('User is not a member of this group');
  }
  
  this.members[memberIndex].isActive = false;
  this.currentMembers = this.members.filter(m => m.isActive).length;
  
  return this.save();
};

module.exports = mongoose.model('SavingsGroup', savingsGroupSchema);