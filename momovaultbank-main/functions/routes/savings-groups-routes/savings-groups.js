const express = require("express");
const router = express.Router();
const SavingsGroup = require("../../models/SavingsGroup");
const GroupContribution = require("../../models/GroupContribution");
const User = require("../../models/User");
const authenticateMiddleware = require("../../middlewares/auth-middleware");

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required."
    });
  }
  next();
};

// 🏗️ CREATE SAVINGS GROUP (Admin only)
router.post("/create", authenticateMiddleware, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      targetAmount,
      maxMembers,
      minimumContribution,
      contributionFrequency,
      startDate,
      endDate,
      allowEarlyWithdrawal,
      penaltyPercentage,
      requiresApproval,
      isPublic,
      withdrawalPhoneNumber
    } = req.body;

    // Validation
    if (!name || !description || !targetAmount || !maxMembers || !minimumContribution || 
        !contributionFrequency || !startDate || !endDate || !withdrawalPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    // Validate phone number format
    const phoneRegex = /^7[678]\d{6}$/;
    if (!phoneRegex.test(withdrawalPhoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format. Must start with 76, 77, or 78 and be 8 digits long."
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be in the past"
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date"
      });
    }

    const savingsGroup = new SavingsGroup({
      name,
      description,
      targetAmount,
      maxMembers,
      minimumContribution,
      contributionFrequency,
      startDate: start,
      endDate: end,
      createdBy: req.user._id,
      withdrawalPhoneNumber,
      rules: {
        allowEarlyWithdrawal: allowEarlyWithdrawal || false,
        penaltyPercentage: penaltyPercentage || 10,
        requiresApproval: requiresApproval !== false
      },
      isPublic: isPublic !== false,
      status: 'active'  // Set status as active by default
    });

    await savingsGroup.save();

    res.status(201).json({
      success: true,
      message: "Savings group created successfully",
      data: savingsGroup
    });

  } catch (error) {
    console.error("Create savings group error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create savings group",
      error: error.message
    });
  }
});

// 📋 GET ALL SAVINGS GROUPS (Admin only)
router.get("/admin/all", authenticateMiddleware, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'createdBy', select: 'userName userEmail' },
        { path: 'members.userId', select: 'userName userEmail phoneNumber' }
      ]
    };

    const groups = await SavingsGroup.find(query)
      .populate('createdBy', 'userName userEmail')
      .populate('members.userId', 'userName userEmail phoneNumber')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await SavingsGroup.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        groups,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalGroups: total,
          hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error("Get all savings groups error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch savings groups",
      error: error.message
    });
  }
});

// 📋 GET MY SAVINGS GROUPS
router.get("/my-groups", authenticateMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const groups = await SavingsGroup.find({
      'members.userId': userId
    })
    .populate('createdBy', 'userName')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        groups
      }
    });

  } catch (error) {
    console.error("Get my savings groups error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your savings groups",
      error: error.message
    });
  }
});

// 📋 GET PUBLIC SAVINGS GROUPS (For users to browse and join)
router.get("/public", authenticateMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { 
      isPublic: true,
      // Allow both active and draft status
      status: { $in: ['active', 'draft'] }
    };

    const groups = await SavingsGroup.find(query)
      .populate('createdBy', 'userName')
      .select('name description targetAmount currentAmount maxMembers currentMembers minimumContribution startDate endDate status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await SavingsGroup.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        groups,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalGroups: total
        }
      }
    });

  } catch (error) {
    console.error("Get public savings groups error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch public savings groups",
      error: error.message
    });
  }
});

// 🔍 GET SINGLE SAVINGS GROUP
router.get("/:groupId", authenticateMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const group = await SavingsGroup.findById(groupId)
      .populate('createdBy', 'userName userEmail')
      .populate('members.userId', 'userName userEmail phoneNumber');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Savings group not found"
      });
    }

    // Check if user has permission to view this group
    const isAdmin = req.user.role === 'admin';
    const isMember = group.members.some(member => 
      member.userId._id.toString() === req.user._id.toString()
    );
    const isCreator = group.createdBy._id.toString() === req.user._id.toString();

    if (!group.isPublic && !isAdmin && !isMember && !isCreator) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this private group"
      });
    }

    res.status(200).json({
      success: true,
      data: group
    });

  } catch (error) {
    console.error("Get savings group error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch savings group",
      error: error.message
    });
  }
});

// ✏️ UPDATE SAVINGS GROUP (Admin only)
router.put("/:groupId", authenticateMiddleware, requireAdmin, async (req, res) => {
  try {
    const { groupId } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.currentAmount;
    delete updates.currentMembers;
    delete updates.members;
    delete updates.createdBy;
    delete updates.inviteCode;

    const group = await SavingsGroup.findByIdAndUpdate(
      groupId,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'userName userEmail');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Savings group not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Savings group updated successfully",
      data: group
    });

  } catch (error) {
    console.error("Update savings group error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update savings group",
      error: error.message
    });
  }
});

// 🗑️ DELETE SAVINGS GROUP (Admin only)
router.delete("/:groupId", authenticateMiddleware, requireAdmin, async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await SavingsGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Savings group not found"
      });
    }

    // Check if group has active members or contributions
    if (group.currentMembers > 0 && group.currentAmount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete group with active members and contributions. Cancel the group instead."
      });
    }

    await SavingsGroup.findByIdAndDelete(groupId);

    res.status(200).json({
      success: true,
      message: "Savings group deleted successfully"
    });

  } catch (error) {
    console.error("Delete savings group error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete savings group",
      error: error.message
    });
  }
});

// 🚀 ACTIVATE SAVINGS GROUP (Admin only)
router.post("/:groupId/activate", authenticateMiddleware, requireAdmin, async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await SavingsGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Savings group not found"
      });
    }

    if (group.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: "Only draft groups can be activated"
      });
    }

    group.status = 'active';
    await group.save();

    res.status(200).json({
      success: true,
      message: "Savings group activated successfully",
      data: group
    });

  } catch (error) {
    console.error("Activate savings group error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to activate savings group",
      error: error.message
    });
  }
});

// 📊 GET SAVINGS GROUP STATISTICS (Admin only)
router.get("/admin/statistics", authenticateMiddleware, requireAdmin, async (req, res) => {
  try {
    const totalGroups = await SavingsGroup.countDocuments();
    const activeGroups = await SavingsGroup.countDocuments({ status: 'active' });
    const completedGroups = await SavingsGroup.countDocuments({ status: 'completed' });
    const draftGroups = await SavingsGroup.countDocuments({ status: 'draft' });

    // Get total savings across all groups
    const totalSavingsResult = await SavingsGroup.aggregate([
      { $group: { _id: null, totalAmount: { $sum: '$currentAmount' } } }
    ]);
    const totalSavings = totalSavingsResult[0]?.totalAmount || 0;

    // Get total members across all groups
    const totalMembersResult = await SavingsGroup.aggregate([
      { $group: { _id: null, totalMembers: { $sum: '$currentMembers' } } }
    ]);
    const totalMembers = totalMembersResult[0]?.totalMembers || 0;

    // Get recent contributions
    const recentContributions = await GroupContribution.find({ status: 'completed' })
      .populate('userId', 'userName')
      .populate('groupId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalGroups,
          activeGroups,
          completedGroups,
          draftGroups,
          totalSavings,
          totalMembers
        },
        recentContributions
      }
    });

  } catch (error) {
    console.error("Get savings group statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message
    });
  }
});

module.exports = router;