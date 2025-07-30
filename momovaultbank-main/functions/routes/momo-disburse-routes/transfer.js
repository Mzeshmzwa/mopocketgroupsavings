const express = require('express');
const router = express.Router();
const { transfer } = require('../../services/DisburseMoney/TransferMoney');
const { deleteTransaction } = require('../../services/DisburseMoney/SaveTransaction');


router.post("/money-transfer",  transfer)
router.delete("/delete-transaction/:id", deleteTransaction)
module.exports = router;