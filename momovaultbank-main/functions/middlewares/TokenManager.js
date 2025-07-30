// TokenManager.js

// Store tokens for each service separately
let momoCollectionToken = null;
let momoDisbursementToken = null;

// ========== Collection Token ==========
function setMomoCollectionToken(token) {
  momoCollectionToken = token;
}

function getMomoCollectionToken() {
  return momoCollectionToken;
}

// ========== Disbursement Token ==========
function setMomoDisbursementToken(token) {
  momoDisbursementToken = token;
}

function getMomoDisbursementToken() {
  return momoDisbursementToken;
}

// ========== Export all ==========
module.exports = {
  setMomoCollectionToken,
  getMomoCollectionToken,
  setMomoDisbursementToken,
  getMomoDisbursementToken,
};
