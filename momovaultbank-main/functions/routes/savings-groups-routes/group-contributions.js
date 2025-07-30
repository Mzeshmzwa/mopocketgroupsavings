const express = require("express");
const router = express.Router();
const SavingsGroup = require("../../models/SavingsGroup");
const GroupContribution = require("../../models/GroupContribution");
const momoTokenManager = require("../../middlewares/TokenManager");
const { momoCollectionBaseUrl } = require("../../middlewares/momoConfig");
const { validateAndFormatPhone } = require("../../utils/phoneValidator");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const authenticateMiddleware = require("../../middlewares/auth-middleware");

// Ensure collection token is available
async function ensureCollectionToken() {
  let token = momoTokenManager.getMomoCollectionToken();
  
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
      console.error("Collection Token Generation Error:", error.response?.data || error.message);
      throw new Error('Failed to generate collection token');
    }
  }
  
  return token;
}

// Check transaction status
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

// 💰 CONTRIBUTE TO SAVINGS GROUP
router.post("/:groupId/contribute", authenticateMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { amount, phoneNumber, description } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!amount || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Amount and phone number are required"
      });
    }

    if (amount < 1) {
      return res.status(400).json({
        success: false,
        message: "Contribution amount must be at least 1"
      });
    }

    // Validate and format phone number
    const phoneValidation = validateAndFormatPhone(phoneNumber);
    if (!phoneValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid phone number: ${phoneValidation.error}`
      });
    }
    const formattedPhone = phoneValidation.formatted;

    // Get savings group
    const group = await SavingsGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Savings group not found"
      });
    }

    // Check if group is active
    if (group.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: "This savings group is not currently accepting contributions"
      });
    }

    // Check if user is a member
    const member = group.members.find(member => 
      member.userId.toString() === userId.toString() && member.isActive
    );

    if (!member) {
      return res.status(403).json({
        success: false,
        message: "You must be a member of this group to contribute"
      });
    }

    // Check minimum contribution
    if (amount < group.minimumContribution) {
      return res.status(400).json({
        success: false,
        message: `Minimum contribution for this group is ${group.minimumContribution} ${group.currency}`
      });
    }

    // Create pending contribution record
    const contribution = new GroupContribution({
      groupId,
      userId,
      amount,
      currency: group.currency,
      contributionType: 'regular',
      paymentMethod: 'momo',
      status: 'pending',
      description: description || `Contribution to ${group.name}`
    });

    await contribution.save();

    // Process MoMo payment
    const momoToken = await ensureCollectionToken();
    const referenceId = uuidv4();

    const momoBody = {
      amount: String(amount),
      currency: group.currency,
      externalId: uuidv4().replace(/-/g, '').slice(0, 24),
      payer: {
        partyIdType: "MSISDN",
        partyId: formattedPhone,
      },
      payerMessage: `Contribution to ${group.name}`,
      payeeNote: "Group savings contribution",
    };

    console.log("Processing MoMo payment for group contribution:", momoBody);

    const momoResponse = await axios.post(`${momoCollectionBaseUrl}/v1_0/requesttopay`, momoBody, {
      headers: {
        'Authorization': `Bearer ${momoToken}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': process.env.TARGET_ENVIRONMENT,
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': process.env.COLLECTION_SUBSCRIPTION_KEY
      },
      validateStatus: () => true
    });

    if (momoResponse.status !== 202) {
      contribution.status = 'failed';
      contribution.failureReason = 'MoMo payment initiation failed';
      await contribution.save();

      return res.status(momoResponse.status).json({
        success: false,
        message: 'Payment initiation failed',
        details: momoResponse.data
      });
    }

    // Poll for transaction status
    let transactionStatus;
    let txStatus = "UNKNOWN";
    for (let attempt = 0; attempt < 60; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      transactionStatus = await checkTransactionStatus(referenceId, momoToken);
      txStatus = transactionStatus?.status?.toUpperCase() || "UNKNOWN";

      if (txStatus === "SUCCESSFUL") break;
      if (txStatus === "FAILED" || txStatus === "REJECTED") break;
    }

    console.log("Group contribution transaction final status:", txStatus);

    if (txStatus !== 'SUCCESSFUL') {
      contribution.status = 'failed';
      contribution.failureReason = `Transaction ${txStatus}`;
      await contribution.save();

      return res.status(400).json({
        success: false,
        message: `Payment was not successful. Status: ${txStatus}`,
        data: { referenceId, status: txStatus }
      });
    }

    // Update contribution record
    contribution.status = 'completed';
    contribution.momoTransactionId = referenceId;
    contribution.processedAt = new Date();
    await contribution.save();

    // Update group totals
    group.currentAmount += amount;
    
    // Update member's contribution total
    const memberIndex = group.members.findIndex(m => 
      m.userId.toString() === userId.toString()
    );
    if (memberIndex !== -1) {
      group.members[memberIndex].totalContributed += amount;
      group.members[memberIndex].lastContribution = new Date();
    }

    // Check if group has reached target
    if (group.currentAmount >= group.targetAmount && group.status === 'active') {
      group.status = 'completed';
    }

    await group.save();

    res.status(200).json({
      success: true,
      message: "Contribution successful",
      data: {
        contributionId: contribution._id,
        amount,
        referenceId,
        groupProgress: {
          currentAmount: group.currentAmount,
          targetAmount: group.targetAmount,
          progressPercentage: Math.round((group.currentAmount / group.targetAmount) * 100),
          isCompleted: group.status === 'completed'
        }
      }
    });

  } catch (error) {
    console.error("Group contribution error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process contribution",
      error: error.message
    });
  }
});

// 📋 GET GROUP CONTRIBUTIONS
router.get("/:groupId/contributions", authenticateMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 20, userId: filterUserId } = req.query;

    // Check if user has access to this group
    const group = await SavingsGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Savings group not found"
      });
    }

    const isAdmin = req.user.role === 'admin';
    const isMember = group.members.some(member => 
      member.userId.toString() === req.user._id.toString() && member.isActive
    );

    if (!isAdmin && !isMember) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this group's contributions"
      });
    }

    // Build query
    const query = { groupId, status: 'completed' };
    if (filterUserId && (isAdmin || filterUserId === req.user._id.toString())) {
      query.userId = filterUserId;
    }

    const contributions = await GroupContribution.find(query)
      .populate('userId', 'userName userEmail')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await GroupContribution.countDocuments(query);

    // Calculate summary statistics
    const totalAmount = contributions.reduce((sum, contrib) => sum + contrib.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        contributions,
        summary: {
          totalContributions: total,
          totalAmount,
          averageContribution: total > 0 ? Math.round(totalAmount / total) : 0
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalContributions: total
        }
      }
    });

  } catch (error) {
    console.error("Get group contributions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contributions",
      error: error.message
    });
  }
});

// 📊 GET USER'S CONTRIBUTION HISTORY
router.get("/my-contributions", authenticateMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, groupId } = req.query;

    const query = { userId, status: 'completed' };
    if (groupId) {
      query.groupId = groupId;
    }

    const contributions = await GroupContribution.find(query)
      .populate('groupId', 'name targetAmount currentAmount')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await GroupContribution.countDocuments(query);
    const totalAmount = await GroupContribution.aggregate([
      { $match: { userId: userId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        contributions,
        summary: {
          totalContributions: total,
          totalAmount: totalAmount[0]?.total || 0
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalContributions: total
        }
      }
    });

  } catch (error) {
    console.error("Get user contributions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your contributions",
      error: error.message
    });
  }
});

module.exports = router;