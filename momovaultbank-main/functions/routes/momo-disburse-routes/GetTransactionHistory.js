const express = require('express');
const router = express.Router();
const { getAllTransactions } = require('../../services/DisburseMoney/TransactionsHistory');

router.get("/transaction-history",  getAllTransactions)


module.exports = router;