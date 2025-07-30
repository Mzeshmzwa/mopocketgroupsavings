
const Vault = require('../../models/Vault');
const Transaction = require('../../models/Transaction');
const momoApi = require('../utils/momoApi');

const PENALTY_PERCENTAGE = 10;

async function deposit(userId, amount, lockPeriodInDays) {
  try {
    const payment = await momoApi.confirmPayment(userId, amount);
    if (!payment.success) return { success: false, message: 'MoMo payment failed' };

    let vault = await Vault.findOne({ userId });
    if (!vault) {
      vault = new Vault({ userId, balance: 0, lockedDeposits: [] });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + lockPeriodInDays);

    vault.lockedDeposits.push({
      amount,
      lockPeriodInDays,
      startDate,
      endDate,
      status: 'locked',
      penaltyApplied: false,
    });

    await vault.save();

    await Transaction.create({
      userId,
      type: 'deposit',
      amount,
      lockPeriodInDays,
      momoTransactionId: payment.transactionId,
    });

    return {
      success: true,
      message: `Deposit of E${amount} locked for ${lockPeriodInDays} days.`,
      data: { lockedDeposits: vault.lockedDeposits },
    };
  } catch (err) {
    return { success: false, message: 'Deposit processing error' };
  }
}

async function withdraw(userId, depositIndex) {
  try {
    const vault = await Vault.findOne({ userId });
    if (!vault || !vault.lockedDeposits || !vault.lockedDeposits[depositIndex]) {
      return { success: false, message: 'Invalid locked deposit' };
    }

    const locked = vault.lockedDeposits[depositIndex];
    if (locked.status !== 'locked') {
      return { success: false, message: 'This deposit has already been withdrawn or unlocked' };
    }

    const now = new Date();
    const isEarly = now < locked.endDate;

    let withdrawalAmount = locked.amount;
    let penaltyFee = 0;

    if (isEarly) {
      penaltyFee = Math.ceil((PENALTY_PERCENTAGE / 100) * locked.amount);
      withdrawalAmount -= penaltyFee;
    }

    const payout = await momoApi.sendToUser(userId, withdrawalAmount);
    if (!payout.success) return { success: false, message: 'MoMo payout failed' };

    vault.lockedDeposits[depositIndex].status = isEarly ? 'withdrawn-early' : 'unlocked';
    vault.lockedDeposits[depositIndex].penaltyApplied = isEarly;
    await vault.save();

    await Transaction.create({
      userId,
      type: 'withdrawal',
      amount: withdrawalAmount,
      penaltyFee,
      momoTransactionId: payout.transactionId,
      relatedLockedDepositIndex: depositIndex,
    });

    if (isEarly && penaltyFee > 0) {
      await Transaction.create({
        userId,
        type: 'penalty',
        amount: penaltyFee,
        penaltyFee,
        relatedLockedDepositIndex: depositIndex,
      });
    }

    return {
      success: true,
      message: `Withdrawal successful${isEarly ? ' (early withdrawal with penalty)' : ''}`,
      data: { withdrawnAmount: withdrawalAmount, penaltyFee },
    };
  } catch (err) {
    return { success: false, message: 'Withdrawal error' };
  }
}

module.exports = { deposit, withdraw };
