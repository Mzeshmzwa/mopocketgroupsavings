
const vaultService = require('../services/vaultService');

async function deposit(req, res) {
  const { userId, amount, lockPeriodInDays } = req.body;
  const result = await vaultService.deposit(userId, amount, lockPeriodInDays);
  res.status(result.success ? 200 : 400).json(result);
}

async function withdraw(req, res) {
  const { userId, depositIndex } = req.body;
  const result = await vaultService.withdraw(userId, depositIndex);
  res.status(result.success ? 200 : 400).json(result);
}

module.exports = { deposit, withdraw };
