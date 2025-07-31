const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const SavingsGroup = require('../../models/SavingsGroup');
const authenticateMiddleware = require('../../middlewares/auth-middleware');

// Utility function to get disbursement access token
const getDisbursementToken = async () => {
  const auth = Buffer.from(process.env.DISBURSEMENT_USER_ID + ':' + process.env.DISBURSEMENT_API_KEY).toString('base64');
  
  try {
    const response = await axios({
      method: 'post',
      url: `${process.env.DISBURSEMENT_BASE_URL}/disbursement/token/`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Ocp-Apim-Subscription-Key': process.env.DISBURSEMENT_PRIMARY_KEY
      }
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('Disbursement token error:', error);
    throw new Error('Failed to get disbursement token');
  }
};

// Utility function to initiate disbursement transfer
const initiateDisbursement = async (token, phoneNumber, amount, externalId) => {
  try {
    const response = await axios({
      method: 'post',
      url: `${process.env.DISBURSEMENT_BASE_URL}/disbursement/v1_0/transfer`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Reference-Id': externalId,
        'X-Target-Environment': process.env.TARGET_ENVIRONMENT,
        'Ocp-Apim-Subscription-Key': process.env.DISBURSEMENT_PRIMARY_KEY,
        'Content-Type': 'application/json'
      },
      data: {
        amount: amount.toString(),
        currency: "EUR",
        externalId: externalId,
        payee: {
          partyIdType: "MSISDN",
          partyId: phoneNumber
        },
        payerMessage: "Group savings withdrawal",
        payeeNote: "Group savings withdrawal"
      }
    });
    
    return response.status === 202;
  } catch (error) {
    console.error('Disbursement transfer error:', error);
    throw new Error('Failed to initiate disbursement');
  }
};

// Withdraw savings from completed group
router.post('/:groupId/withdraw', authenticateMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await SavingsGroup.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Savings group not found'
      });
    }

    // Verify group is completed and has funds
    if (group.currentAmount < group.targetAmount) {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw funds. Group target amount has not been reached.'
      });
    }

    // Verify withdrawal phone number
    if (!group.withdrawalPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'No withdrawal phone number specified for this group'
      });
    }

    // Generate unique transaction ID
    const externalId = uuidv4();

    try {
      // Get disbursement token
      const token = await getDisbursementToken();

      // Initiate disbursement
      const disbursementResult = await initiateDisbursement(
        token,
        group.withdrawalPhoneNumber,
        group.currentAmount,
        externalId
      );

      if (disbursementResult) {
        // Update group status
        group.status = 'completed';
        group.currentAmount = 0; // Reset amount after successful withdrawal
        await group.save();

        return res.status(200).json({
          success: true,
          message: 'Withdrawal initiated successfully',
          data: {
            transactionId: externalId,
            amount: group.currentAmount,
            phoneNumber: group.withdrawalPhoneNumber
          }
        });
      }

    } catch (error) {
      console.error('Withdrawal processing error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process withdrawal',
        error: error.message
      });
    }

  } catch (error) {
    console.error('Withdrawal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal',
      error: error.message
    });
  }
});

// Get withdrawal status
router.get('/:groupId/withdrawal-status/:transactionId', authenticateMiddleware, async (req, res) => {
  try {
    const { groupId, transactionId } = req.params;
    const token = await getDisbursementToken();

    const response = await axios({
      method: 'get',
      url: `${process.env.DISBURSEMENT_BASE_URL}/disbursement/v1_0/transfer/${transactionId}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Target-Environment': process.env.TARGET_ENVIRONMENT,
        'Ocp-Apim-Subscription-Key': process.env.DISBURSEMENT_PRIMARY_KEY
      }
    });

    res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Get withdrawal status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal status',
      error: error.message
    });
  }
});

module.exports = router;
