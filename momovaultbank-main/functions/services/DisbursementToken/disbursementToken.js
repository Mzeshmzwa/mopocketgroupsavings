const { momoDisbursementBaseUrl } = require('../../middlewares/momoConfig');
const momoTokenManager = require('../../middlewares/TokenManager');

// Get access token for DISBURSEMENT
exports.AccessTokenGeneration = async function (req, res) {
  try {
    const apiUserId = process.env.DISBURSEMENT_API_USER;
    const apiKey = process.env.DISBURSEMENT_API_KEY;

    // Combine credentials and encode in base64
    const credentials = `${apiUserId}:${apiKey}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');

    const response = await fetch(`${momoDisbursementBaseUrl}/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Ocp-Apim-Subscription-Key': process.env.DISBURSEMENT_SUBSCRIPTION_KEY,
        'Authorization': `Basic ${encodedCredentials}`,
      },
    });

    const data = await response.json();

    if (response.ok && data.access_token) {
      // ✅ Save disbursement token only
      momoTokenManager.setMomoDisbursementToken(data.access_token);
    }

    // Response handling
    if (res) {
      if (response.ok) {
        res.json({ message: 'Disbursement token retrieved successfully', data });
      } else {
        res.status(response.status).json({ message: 'Failed to retrieve disbursement token' });
      }
    } else {
      if (response.ok) {
        return { data };
      } else {
        throw new Error('Failed to retrieve disbursement token');
      }
    }
  } catch (error) {
    console.error('Disbursement Token Error:', error);

    if (res) {
      res.status(500).json({ error: 'Internal server error. Please try again.' });
    } else {
      throw error;
    }
  }
};
