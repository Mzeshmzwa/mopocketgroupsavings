const express = require("express");
const router = express.Router(); // ✅ FIXED
const User = require("../../models/User");
const Vault = require("../../models/Vault");
const Transaction = require("../../models/Transaction");
const LockedDeposit = require("../../models/LockedDeposit");

// 🧠 Fetch all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// 💰 Fetch all transactions
router.get("/transaction", async (req, res) => {
  try {
    const transactions = await Transaction.find();
    res.json({ transaction: transactions });
  } catch (err) {
    console.error("Fetch transactions error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// 🏦 Fetch all vaults
router.get("/vault", async (req, res) => {
  try {
    const vaults = await Vault.find();
    res.json({ vault: vaults });
  } catch (err) {
    console.error("Fetch vaults error:", err); // 👈 ADD THIS LINE
    res.status(500).json({ error: "Failed to fetch vaults" });
  }
});

// 💰 System Revenue Dashboard
router.get("/revenue", async (req, res) => {
  try {
    // Get all penalty transactions (flat fees + early withdrawal penalties)
    const penaltyTransactions = await Transaction.find({ type: "penalty" });
    
    // Calculate total system revenue
    const totalRevenue = penaltyTransactions.reduce((sum, transaction) => {
      return sum + (transaction.amount || 0);
    }, 0);
    
    // Separate flat fees from early withdrawal penalties
    const flatFees = penaltyTransactions.filter(t => t.amount === 5);
    const earlyWithdrawalPenalties = penaltyTransactions.filter(t => t.amount !== 5);
    
    const totalFlatFees = flatFees.reduce((sum, t) => sum + t.amount, 0);
    const totalEarlyWithdrawalPenalties = earlyWithdrawalPenalties.reduce((sum, t) => sum + t.amount, 0);
    
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const totalDeposits = await LockedDeposit.countDocuments();
    const totalWithdrawals = await Transaction.countDocuments({ type: "withdrawal" });
    
    // Calculate total deposits amount
    const depositTransactions = await Transaction.find({ type: "deposit" });
    const totalDepositsAmount = depositTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate total withdrawals amount
    const withdrawalTransactions = await Transaction.find({ type: "withdrawal" });
    const totalWithdrawalsAmount = withdrawalTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate current locked funds
    const lockedDeposits = await LockedDeposit.find({ status: "locked" });
    const currentLockedFunds = lockedDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    
    // Revenue breakdown
    const revenueBreakdown = {
      totalRevenue: totalRevenue,
      flatFeesRevenue: totalFlatFees,
      earlyWithdrawalPenaltiesRevenue: totalEarlyWithdrawalPenalties,
      flatFeesCount: flatFees.length,
      earlyWithdrawalPenaltiesCount: earlyWithdrawalPenalties.length
    };
    
    // System statistics
    const systemStats = {
      totalUsers,
      totalDeposits,
      totalWithdrawals,
      totalDepositsAmount,
      totalWithdrawalsAmount,
      currentLockedFunds,
      netUserFunds: totalDepositsAmount - totalWithdrawalsAmount, // Money still in the system
      systemProfit: totalRevenue // All penalties and fees are system profit
    };
    
    res.json({
      success: true,
      data: {
        revenueBreakdown,
        systemStats,
        summary: {
          totalSystemRevenue: totalRevenue,
          totalUserFunds: totalDepositsAmount - totalWithdrawalsAmount,
          systemProfitMargin: totalDepositsAmount > 0 ? ((totalRevenue / totalDepositsAmount) * 100).toFixed(2) + '%' : '0%'
        }
      }
    });
    
  } catch (err) {
    console.error("Revenue calculation error:", err);
    res.status(500).json({ error: "Failed to calculate system revenue" });
  }
});

module.exports = router;
