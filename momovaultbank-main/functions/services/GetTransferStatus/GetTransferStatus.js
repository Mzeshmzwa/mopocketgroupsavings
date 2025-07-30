const {
  momoDisbursementBaseUrl,
  momoCollectionBaseUrl,
} = require('../../middlewares/momoConfig');

const momoTokenManager = require('../../middlewares/TokenManager.js');
const axios = require('axios');

exports.GetTransferStatus = async function (req, res) {
  // 1. Get channel and referenceId from request
  const channel = req.query.channel || 'disbursement'; // default to disbursement
  const referenceId = req.query.referenceId;

  if (!referenceId) {
    return res.status(400).json({ message: 'referenceId is required.' });
  }

  // 2. Pick base URL and token depending on channel
  let momoToken, momoBaseUrl, subscriptionKey;

  if (channel === 'collection') {
    momoToken = momoTokenManager.getMomoCollectionToken();
    momoBaseUrl = momoCollectionBaseUrl;
    subscriptionKey = process.env.COLLECTION_SUBSCRIPTION_KEY;
  } else if (channel === 'disbursement') {
    momoToken = momoTokenManager.getMomoDisbursementToken();
    momoBaseUrl = momoDisbursementBaseUrl;
    subscriptionKey = process.env.DISBURSEMENT_SUBSCRIPTION_KEY;
  } else {
    return res.status(400).json({ message: 'Invalid channel. Must be "collection" or "disbursement".' });
  }

  if (!momoToken) {
    return res.status(401).json({ message: 'Token not available. Please obtain a token first.' });
  }

  try {
    const response = await axios.get(`${momoBaseUrl}/v1_0/transfer/${referenceId}`, {
      headers: {
        'Authorization': `Bearer ${momoToken}`,
        'X-Target-Environment': process.env.TARGET_ENVIRONMENT,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Ocp-Apim-Subscription-Key': subscriptionKey,
      },
    });

    res.json({
      status: response.data.status,
      financialTransactionId: response.data.financialTransactionId,
      rawResponse: response.data,
    });

    console.log(`[${channel.toUpperCase()}] Transfer status:`, response.data);

  } catch (error) {
    console.error(`[${channel.toUpperCase()}] Transfer status error:`, error.response?.data || error.message);
    const status = error.response?.status || 500;
    res.status(status).json({ error: error.response?.data || error.message });
  }
};
