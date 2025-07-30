const momoTokenManager = require('../../middlewares/TokenManager.js');
const { momoDisbursementBaseUrl } = require('../../middlewares/momoConfig.js');

exports.BalanceCurrency = async function (req, res) {
  // Check if disbursement token is available
  const momoToken = momoTokenManager.getMomoDisbursementToken();

  if (!momoToken) {
    return res.status(401).json({ message: 'Disbursement token not available. Please obtain a token first.' });
  }

  try {
    const response = await fetch(`${momoDisbursementBaseUrl}/v1_0/account/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${momoToken}`,
        'X-Target-Environment': process.env.TARGET_ENVIRONMENT,
        'Cache-Control': 'no-cache',
        'Ocp-Apim-Subscription-Key': process.env.DISBURSEMENT_SUBSCRIPTION_KEY,
      },
    });

    if (response.status === 200) {
      const data = await response.json(); // Optional: get actual balance
      res.status(200).json({
        responseStatus: response.status,
        balance: data?.availableBalance || "0.00",
        currency: data?.currency || "EUR"
      });
    } else {
      const responseBody = await response.text();
      res.json({
        responseStatus: response.status,
        responseBody
      });
    }

    console.log('Disbursement balance check - status:', response.status);

  } catch (error) {
    console.error('Disbursement balance check failed:', error);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
};
