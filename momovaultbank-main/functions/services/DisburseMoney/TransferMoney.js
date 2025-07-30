const Vault = require('../../models/Vault');
const LockedDeposit = require('../../models/LockedDeposit');
const Transaction = require('../../models/Transaction');
const momoTokenManager = require('../../middlewares/TokenManager');
const { momoDisbursementBaseUrl } = require('../../middlewares/momoConfig');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

exports.withdraw = async function (req, res) {
  const userId = req.user._id;
  const { phoneNumber, amount } = req.body;

  try {
    const vault = await Vault.findOne({ userId });
    if (!vault || vault.balance < amount) {
      return res.status(400).json({ error: 'Insufficient vault balance' });
    }

    const deposits = await LockedDeposit.find({ userId, status: 'locked' });

    let totalWithdrawable = 0;
    let penalties = 0;
    const now = new Date();

    for (const deposit of deposits) {
      const depositTime = new Date(deposit.createdAt);
      const hoursSinceDeposit = (now - depositTime) / (1000 * 60 * 60);
      const lockPeriodInHours = deposit.lockPeriodInDays * 24;

      if (hoursSinceDeposit < 24) continue; // skip if less than 24hrs

      totalWithdrawable += deposit.amount;

      const isEarlyWithdrawal = hoursSinceDeposit < lockPeriodInHours;

      if (isEarlyWithdrawal && deposit.lockPeriodInDays >= 1 && deposit.lockPeriodInDays <= 3) {
        penalties += deposit.amount * 0.1; // 10% penalty
      }

      deposit.status = 'unlocked';
      await deposit.save();
    }

    if (totalWithdrawable < amount) {
      return res.status(400).json({ error: 'Insufficient unlocked funds to withdraw this amount' });
    }

    const momoToken = momoTokenManager.getMomoDisbursementToken();
    if (!momoToken) return res.status(401).json({ error: "No MoMo token available" });

    const referenceId = uuidv4();
    const totalDeduction = parseFloat(amount) + 5 + penalties;

    vault.balance -= totalDeduction;
    await vault.save();

    const formattedPhone = phoneNumber.startsWith("268") ? phoneNumber : "268" + phoneNumber;

    const body = {
      amount: String(amount),
      currency: 'EUR',
      externalId: uuidv4().replace(/-/g, '').slice(0, 24),
      payee: {
        partyIdType: "MSISDN",
        partyId: formattedPhone,
      },
      payerMessage: "Withdrawal from MoMoVault",
      payeeNote: "Vault funds",
    };

    const response = await axios.post(`${momoDisbursementBaseUrl}/v1_0/transfer/${referenceId}`, body, {
      headers: {
        'Authorization': `Bearer ${momoToken}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': process.env.TARGET_ENVIRONMENT,
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env.DISBURSEMENT_SUBSCRIPTION_KEY,
      },
      validateStatus: () => true,
    });

    if (response.status === 202) {
      await Transaction.create({
        userId,
        type: "withdraw",
        amount: parseFloat(amount),
        status: "PENDING",
        fee: 5,
        penalty: penalties,
      });

      return res.json({
        message: "Withdrawal initiated successfully.",
        withdrawnAmount: amount,
        flatFee: 5,
        penalty: penalties,
        totalDeducted: totalDeduction,
        referenceId,
      });
    } else {
      return res.status(response.status).json({
        error: 'Transfer failed',
        details: response.data,
      });
    }

  } catch (err) {
    const status = err.response?.status || 500;
    const data = err.response?.data || err.message;

    console.error("Withdrawal error:", data);
    return res.status(status).json({
      error: 'Withdrawal failed',
      details: typeof data === 'object' ? JSON.stringify(data, null, 2) : data,
    });
  }
};
