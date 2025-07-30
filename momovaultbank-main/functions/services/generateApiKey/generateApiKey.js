const axios = require('axios');
const { momoHost } = require('../../middlewares/momoConfig');

const generateApiKey = async (req, res) => {
  try {
    const xReferenceId = req.params.referenceId;

    if (!xReferenceId) {
      return res.status(400).json({ message: 'Reference ID is required' });
    }

    const url = `https://${momoHost}/v1_0/apiuser/${xReferenceId}/apikey`;

    const response = await axios.post(
      url,
      {}, // No body required for this POST
      {
        headers: {
          'Cache-Control': 'no-cache',
          'Ocp-Apim-Subscription-Key': process.env.COLLECTION_SUBSCRIPTION_KEY
        }
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('API Key Generation Error:', error);

    if (error.response) {
      // API returned a response with an error status
      return res.status(error.response.status).json({
        message: 'Failed to generate API key',
        error: error.response.data
      });
    }

    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { generateApiKey };
