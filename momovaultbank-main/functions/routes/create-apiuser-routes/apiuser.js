// /routes/momoRoutes.js
const express = require('express');
const router = express.Router();
const { generateApiKey } = require('../../services/generateApiKey/generateApiKey');

// Route: GET /momo/generate-api-key/:referenceId
router.post('/generate-api-key/:referenceId', generateApiKey);

module.exports = router;

