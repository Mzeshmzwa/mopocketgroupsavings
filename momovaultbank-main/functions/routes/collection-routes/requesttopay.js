const express = require('express');
const router = express.Router();
const { collect } = require('../../services/CollectMoney/requesttopay');
router.post("/money-collect",  collect)

module.exports = router;
