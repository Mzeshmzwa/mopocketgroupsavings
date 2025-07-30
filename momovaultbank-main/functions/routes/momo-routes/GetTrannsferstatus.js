const express = require('express');
const router = express.Router();
const { GetTransferStatus } = require('../../services/GetTransferStatus/GetTransferStatus');

router.get("/transfer/:referenceId", GetTransferStatus)

module.exports = router;