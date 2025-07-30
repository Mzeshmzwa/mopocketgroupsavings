const express = require('express');
const router = express.Router();
const { BalanceCurrency } = require('../../services/GetAccBalanceCurrency/GetAccBalanceCurrency');

router.get("/account-owner-balance",  BalanceCurrency)

module.exports = router;