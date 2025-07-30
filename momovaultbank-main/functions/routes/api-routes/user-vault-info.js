const express = require("express");
const router = express.Router();
const Vault = require("../../models/Vault");
const LockedDeposit = require("../../models/LockedDeposit");
const Transaction = require("../../models/Transaction");
const authenticateMiddleware = require("../../middlewares/auth-middleware");

// Get user's vault information
router.get("/vault-info", authenticateMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get vault information
    const vault = await Vault.findOne({ userId });
    
    // Get locked deposits
    const lockedDeposits = await LockedDeposit.find({ userId }).sort({ createdAt: -1 });
    
    // Get recent transactions
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate individual deposit information
    const now = new Date();
    let totalLockedAmount = 0;
    let withdrawableDepositsCount = 0;
    
    const depositSummary = lockedDeposits.map(deposit => {
      if (deposit.status !== "locked") {
        return {
          depositId: deposit._id,
          amount: deposit.amount,
          status: deposit.status,
          canWithdraw: false,
          reason: "Already withdrawn"
        };
      }
      
      const depositTime = new Date(deposit.createdAt);
      const hoursSinceDeposit = (now - depositTime) / (1000 * 60 * 60);
      const lockPeriodInHours = deposit.lockPeriodInDays * 24;
      const isEarlyWithdrawal = hoursSinceDeposit < lockPeriodInHours;
      
      totalLockedAmount += deposit.amount;
      
      const canWithdraw = true; // No 24-hour restriction
      if (canWithdraw) withdrawableDepositsCount++;
      
      let penalty = 0;
      if (isEarlyWithdrawal) {
        penalty = deposit.amount * 0.10; // Flat 10% penalty for all early withdrawals
      }
      
      const flatFee = 5;
      const netAmount = Math.max(0, deposit.amount - penalty - flatFee);
      
      return {
        depositId: deposit._id,
        amount: deposit.amount,
        lockPeriodInDays: deposit.lockPeriodInDays,
        status: deposit.status,
        canWithdraw,
        isEarlyWithdrawal,
        penalty,
        flatFee,
        netAmount,
        hoursUntilEligible: 0, // No waiting period
        reason: null // Can always withdraw
      };
    });

    res.status(200).json({
      success: true,
      data: {
        vault: vault || { balance: 0, lockedDeposits: [] },
        lockedDeposits,
        recentTransactions: transactions,
        depositSummary: {
          totalLockedAmount,
          totalDeposits: lockedDeposits.filter(d => d.status === "locked").length,
          withdrawableDepositsCount,
          individualDeposits: depositSummary
        }
      }
    });

  } catch (error) {
    console.error("Vault info error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vault information",
      error: error.message
    });
  }
});

// Get withdrawal eligibility for specific deposits
router.get("/withdrawal-eligibility", authenticateMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const lockedDeposits = await LockedDeposit.find({ 
      userId, 
      status: "locked" 
    }).sort({ createdAt: 1 });

    const now = new Date();
    const eligibilityInfo = lockedDeposits.map(deposit => {
      const depositTime = new Date(deposit.createdAt);
      const hoursSinceDeposit = (now - depositTime) / (1000 * 60 * 60);
      const lockPeriodInHours = deposit.lockPeriodInDays * 24;
      
      const canWithdraw = true; // No 24-hour restriction
      const isEarlyWithdrawal = hoursSinceDeposit < lockPeriodInHours;
      const hoursUntilMaturity = Math.max(0, lockPeriodInHours - hoursSinceDeposit);
      
      let penalty = 0;
      if (isEarlyWithdrawal) {
        penalty = deposit.amount * 0.10; // Flat 10% penalty for all early withdrawals
      }

      const flatFee = 5; // Individual E5 fee per deposit
      const netAmount = Math.max(0, deposit.amount - penalty - flatFee);
      return {
        depositId: deposit._id,
        amount: deposit.amount,
        lockPeriodInDays: deposit.lockPeriodInDays,
        depositDate: deposit.createdAt,
        canWithdraw,
        isEarlyWithdrawal,
        penalty,
        flatFee,
        netAmount,
        hoursUntilMaturity: Math.ceil(hoursUntilMaturity)
      };
    });

    res.status(200).json({
      success: true,
      data: eligibilityInfo
    });

  } catch (error) {
    console.error("Withdrawal eligibility error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch withdrawal eligibility",
      error: error.message
    });
  }
});

module.exports = router;