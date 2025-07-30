const express = require('express');
const router = express.Router();
const { AccessTokenGeneration } = require('../../services/DisbursementToken/disbursementToken');

router.post("/generate-token", AccessTokenGeneration)

module.exports = router;