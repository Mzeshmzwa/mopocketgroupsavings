const express = require("express");
const Vault = require("../../models/Vault");
const Transaction = require("../../models/Transaction");
const authenticateMiddleware = require("../../middlewares/auth-middleware");
const router = express.Router();

// 🔒 Deposit
router.post("/deposit", authenticateMiddleware, async (req, res) => {
  const { userId, amount, lockPeriodInDays } = req.body;
  
  // Validate that the authenticated user matches the userId
  if (req.user._id.toString() !== userId) {
    return res.status(403).json({ 
      success: false, 
      message: "Unauthorized: Cannot deposit for another user" 
    });
  }

  try {
    let vault = await Vault.findOne({ userId });

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + lockPeriodInDays);

    const lockedDeposit = {
      amount,
      lockPeriodInDays,
      startDate: new Date(),
      endDate,
    };

    if (!vault) {
      vault = new Vault({
        userId,
        balance: 0,
        lockedDeposits: [lockedDeposit],
      });
    } else {
      vault.lockedDeposits.push(lockedDeposit);
    }

    await vault.save();

    await Transaction.create({
      userId,
      type: "deposit",
      amount,
      lockPeriodInDays,
    });

    res.status(200).json({ success: true, message: "Deposit successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 💸 Withdraw
// Withdraw functionality moved to separate file for better organization
// Use /api/withdraw endpoint instead

module.exports = router;
