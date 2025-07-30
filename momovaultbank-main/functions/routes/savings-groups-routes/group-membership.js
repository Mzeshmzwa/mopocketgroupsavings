const express = require("express");
const router = express.Router();
const SavingsGroup = require("../../models/SavingsGroup");
const GroupContribution = require("../../models/GroupContribution");
const authenticateMiddleware = require("../../middlewares/auth-middleware");

// 🤝 JOIN SAVINGS GROUP
router.post("/:groupId/join", authenticateMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await SavingsGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Savings group not found"
      });
    }

    // Check if group is active and accepting members
    if (group.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: "This group is not currently accepting new members"
      });
    }

    // Check if user is already a member
    const existingMember = group.members.find(member => 
      member.userId.toString() === userId.toString() && member.isActive
    );

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this group"
      });
    }

    // Check if group has space
    if (group.currentMembers >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: "This group has reached its maximum member limit"
      });
    }

    // Add user to group
    await group.addMember(userId);

    res.status(200).json({
      success: true,
      message: "Successfully joined the savings group",
      data: {
        groupId: group._id,
        groupName: group.name,
        memberCount: group.currentMembers
      }
    });

  } catch (error) {
    console.error("Join savings group error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to join savings group"
    });
  }
});

// 🚪 LEAVE SAVINGS GROUP
router.post("/:groupId/leave", authenticateMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await SavingsGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Savings group not found"
      });
    }

    // Check if user is a member
    const member = group.members.find(member => 
      member.userId.toString() === userId.toString() && member.isActive
    );

    if (!member) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this group"
      });
    }

    // Check if user has contributions that need to be handled
    const userContributions = await GroupContribution.find({
      groupId,
      userId,
      status: 'completed'
    });

    const totalContributed = userContributions.reduce((sum, contrib) => sum + contrib.amount, 0);

    if (totalContributed > 0 && !group.rules.allowEarlyWithdrawal) {
      return res.status(400).json({
        success: false,
        message: "Cannot leave group with active contributions. Early withdrawal is not allowed for this group."
      });
    }

    // Remove user from group
    await group.removeMember(userId);

    res.status(200).json({
      success: true,
      message: "Successfully left the savings group",
      data: {
        totalContributed,
        refundEligible: group.rules.allowEarlyWithdrawal
      }
    });

  } catch (error) {
    console.error("Leave savings group error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to leave savings group"
    });
  }
});

// 📋 GET USER'S SAVINGS GROUPS
router.get("/my-groups", authenticateMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await SavingsGroup.find({
      'members.userId': userId,
      'members.isActive': true
    })
      .populate('createdBy', 'userName')
      .select('-members') // Don't include all members in the list
      .sort({ createdAt: -1 });

    // Get user's contribution summary for each group
    const groupsWithContributions = await Promise.all(
      groups.map(async (group) => {
        const contributions = await GroupContribution.find({
          groupId: group._id,
          userId,
          status: 'completed'
        });

        const totalContributed = contributions.reduce((sum, contrib) => sum + contrib.amount, 0);
        const lastContribution = contributions.length > 0 
          ? contributions.sort((a, b) => b.createdAt - a.createdAt)[0].createdAt
          : null;

        return {
          ...group.toObject(),
          userStats: {
            totalContributed,
            lastContribution,
            contributionCount: contributions.length
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: groupsWithContributions
    });

  } catch (error) {
    console.error("Get user savings groups error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your savings groups",
      error: error.message
    });
  }
});

// 🔍 JOIN GROUP BY INVITE CODE
router.post("/join-by-code", authenticateMiddleware, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user._id;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: "Invite code is required"
      });
    }

    const group = await SavingsGroup.findOne({ 
      inviteCode: inviteCode.toUpperCase() 
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Invalid invite code"
      });
    }

    // Check if group is active
    if (group.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: "This group is not currently accepting new members"
      });
    }

    // Check if user is already a member
    const existingMember = group.members.find(member => 
      member.userId.toString() === userId.toString() && member.isActive
    );

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this group"
      });
    }

    // Check if group has space
    if (group.currentMembers >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: "This group has reached its maximum member limit"
      });
    }

    // Add user to group
    await group.addMember(userId);

    res.status(200).json({
      success: true,
      message: "Successfully joined the savings group",
      data: {
        groupId: group._id,
        groupName: group.name,
        inviteCode: group.inviteCode,
        memberCount: group.currentMembers
      }
    });

  } catch (error) {
    console.error("Join by invite code error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to join savings group"
    });
  }
});

module.exports = router;