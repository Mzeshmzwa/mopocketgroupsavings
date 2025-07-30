// /routes/TokenGeneration.js
const express = require('express');
const router = express.Router();
const { AccessTokenGeneration } = require('../../services/CollectionToken/collectionaToken.js');

router.post("/token", AccessTokenGeneration);

module.exports = router;
