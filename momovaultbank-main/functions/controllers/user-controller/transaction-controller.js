
const transactionService = require('../../services/CollectMoney/transactionService');

async function getUserTransactions(req, res) {
  const { userId } = req.params;
  const result = await transactionService.getTransactionsForUser(userId);
  res.status(result.success ? 200 : 400).json(result);
}

module.exports = { getUserTransactions };
