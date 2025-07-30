const { momoCollectionBaseUrl } = require('../../middlewares/momoConfig.js');
const momoTokenManager = require('../../middlewares/TokenManager.js');
const referenceIdManager = require('../../middlewares/CollectionReferenceIdManager.js');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { validateAndFormatPhone } = require('../../utils/phoneValidator');

// Import models
const Vault = require('../../models/Vault');
const LockedDeposit = require('../../models/LockedDeposit');
const Transaction = require('../../models/Transaction');

async function ensureMomoToken() {
  let token = momoTokenManager.getMomoCollectionToken();
  console.log('Current token:', token);

  if (!token) {
    const apiUserId = process.env.COLLECTION_API_USER;
    const apiKey = process.env.COLLECTION_API_KEY;
    const credentials = `${apiUserId}:${apiKey}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');

    try {
      const response = await axios.post(`${momoCollectionBaseUrl}/token/`, null, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Ocp-Apim-Subscription-Key': process.env.COLLECTION_SUBSCRIPTION_KEY,
          'Authorization': `Basic ${encodedCredentials}`,
        },
      });
      token = response.data.access_token;
      momoTokenManager.setMomoCollectionToken(token);
    } catch (error) {
      console.error("Token Generation Error:", error.response?.data || error.message);
      throw new Error('Failed to generate Momo token');
    }
  }

  return token;
}

async function checkTransactionStatus(referenceId, momoToken) {
  try {
    const response = await axios.get(`${momoCollectionBaseUrl}/v1_0/requesttopay/${referenceId}`, {
      headers: {
        'Authorization': `Bearer ${momoToken}`,
        'X-Target-Environment': process.env.TARGET_ENVIRONMENT,
        'Ocp-Apim-Subscription-Key': process.env.COLLECTION_SUBSCRIPTION_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Transaction status fetch failed:", error.response?.data || error.message);
    return { error: "Failed to fetch transaction status" };
  }
}

exports.collect = async function (req, res) {
  try {
    const momoToken = await ensureMomoToken();
    if (!momoToken) {
      return res.status(401).json({ error: 'No MoMo access token available.' });
    }

    const referenceId = uuidv4();
    referenceIdManager.setReferenceId(referenceId);

    const { amount, phoneNumber, orderId, userId, lockPeriodInDays } = req.body;

    // Validate and format phone number
    const phoneValidation = validateAndFormatPhone(phoneNumber);
    if (!phoneValidation.isValid) {
      return res.status(400).json({
        error: 'Invalid phone number',
        details: phoneValidation.error
      });
    }
    const formattedPhone = phoneValidation.formatted;

    const body = {
      amount: String(amount),
      currency: 'EUR',
      externalId: orderId || uuidv4().replace(/-/g, '').slice(0, 24),
      payer: {
        partyIdType: "MSISDN",
        partyId: formattedPhone,
      },
      payerMessage: "Payment for services rendered",
      payeeNote: "Money collected",
    };

    console.log("> Sending request to:", `${momoCollectionBaseUrl}/v1_0/requesttopay/${referenceId}`);
    console.log("> Request Body:", body);

    const response = await axios.post(`${momoCollectionBaseUrl}/v1_0/requesttopay`, body, {
      headers: {
        'Authorization': `Bearer ${momoToken}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': process.env.TARGET_ENVIRONMENT,
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env.COLLECTION_SUBSCRIPTION_KEY
      },
      validateStatus: () => true
    });

    if (response.status === 202) {
      // 🕒 Poll for up to 3 minutes (60 attempts * 3 seconds)
      let transactionStatus;
      let txStatus = "UNKNOWN";
      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 sec delay
        transactionStatus = await checkTransactionStatus(referenceId, momoToken);
        txStatus = transactionStatus?.status?.toUpperCase() || "UNKNOWN";

        if (txStatus === "SUCCESSFUL") break;
        if (txStatus === "FAILED" || txStatus === "REJECTED") break;
      }

      console.log("Transaction final status after polling:", txStatus);

      if (txStatus !== 'SUCCESSFUL') {
        return res.status(400).json({
          success: false,
          message: `Transaction was not successful. Status: ${txStatus}`,
          status: txStatus,
          referenceId,
        });
      }

      // ✅ Update vault and record deposit
      let vault = await Vault.findOne({ userId });
      if (!vault) {
        vault = new Vault({ userId, balance: 0 });
      }

      vault.balance += parseFloat(amount);
      await vault.save();

      await LockedDeposit.create({
        userId,
        amount: parseFloat(amount),
        lockPeriodInDays: parseInt(lockPeriodInDays),
        status: "locked",
      });

      await Transaction.create({
        userId,
        type: "deposit",
        amount: parseFloat(amount),
        status: txStatus,
      });

      return res.status(200).json({
        message: "Deposit successful.",
        referenceId,
        financialTransactionId: transactionStatus.financialTransactionId,
        status: txStatus,
      });
    } else {
      return res.status(response.status).json({
        error: 'MoMo request failed',
        status: response.status,
        data: response.data,
      });
    }
  } catch (err) {
    console.error("Collection Error:", err.message);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};
