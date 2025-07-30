const { momoCollectionBaseUrl } = require('../../middlewares/momoConfig.js'); // ✅ Correct base URL
const momoTokenManager = require('../../middlewares/TokenManager.js');
const axios = require('axios');

exports.AccessTokenGeneration = async function (req, res) {
  try {
    const apiUserId = process.env.COLLECTION_API_USER;
    const apiKey = process.env.COLLECTION_API_KEY;

    // Encode credentials
    const credentials = `${apiUserId}:${apiKey}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');

    // Request token
    const response = await axios.post(`${momoCollectionBaseUrl}/token/`, null, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Ocp-Apim-Subscription-Key': process.env.COLLECTION_SUBSCRIPTION_KEY,
        'Authorization': `Basic ${encodedCredentials}`,
      },
    });

    const { access_token } = response.data;

    if (access_token) {
      momoTokenManager.setMomoCollectionToken(access_token); // ✅ Save token
    }

    // Return result
    if (res) {
      res.status(200).json({
        message: 'Collection token retrieved successfully',
        data: response.data,
      });
    } else {
      return { data: response.data };
    }

  } catch (error) {
    console.error('Collection Token Error:', error.response?.data || error.message);

    if (res) {
      const status = error.response?.status || 500;
      const message = error.response?.data || 'Internal server error';
      res.status(status).json({ error: message });
    } else {
      throw error;
    }
  }
};
