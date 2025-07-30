
const Transaction = require('../../models/Transaction');

async function getTransactionsForUser(userId) {
  const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });
  return { success: true, data: transactions };
}

module.exports = { getTransactionsForUser };
